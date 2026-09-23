const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "wordpress-page-templates");
const siteBase = "https://2027.ieee-africon.org";
const uploadsBase = `${siteBase}/wp-content/uploads/sites/882`;
const pages = [
  "index",
  "about",
  "authors",
  "committees",
  "contact",
  "program",
  "registration",
  "speakers",
  "sponsors",
  "travel-support",
  "venue",
];
// WordPress applies wpautop to vc_column_text. Complex layouts must remain raw
// so injected paragraph elements cannot become slider or grid children.
const rawContentPages = new Set(["index", "contact", "registration"]);
const wordpressSlugs = { contact: "contact-us" };

function encodedRawHtml(value) {
  return `[vc_raw_html]${Buffer.from(value, "utf8").toString("base64")}[/vc_raw_html]`;
}

function removeHeaderOverlap(styleBlock) {
  return styleBlock.replace(
    /\[vc_raw_html\]([A-Za-z0-9+/=\s]+)\[\/vc_raw_html\]/,
    (_match, encodedStyles) => {
      const styles = Buffer.from(encodedStyles.trim(), "base64")
        .toString("utf8")
        .replace("margin-top:-95px!important;", "");

      return encodedRawHtml(styles);
    },
  );
}

function extract(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error(`Could not extract content between ${startMarker} and ${endMarker}`);
  }
  return html.slice(start, end).trim();
}

function pageContent(name, html) {
  if (name === "index") {
    return extract(html, '<section class="hero-slider"', "<!-- ===== FOOTER");
  }

  if (name === "registration") {
    const main = extract(html, '<div class="reg-content">', "<!-- FOOTER -->");
    const modal = extract(html, '<div class="modal-overlay"', "<!-- /modal-overlay -->")
      + "\n    <!-- /modal-overlay -->";
    return `${main}\n${modal}`;
  }

  const start = html.indexOf('<div class="page-hero">');
  const footerComment = html.indexOf("<!-- FOOTER", start);
  const footerTag = html.indexOf('<footer class="site-footer">', start);
  const candidates = [footerComment, footerTag].filter((position) => position >= 0);
  const end = Math.min(...candidates);
  if (start < 0 || !Number.isFinite(end)) {
    throw new Error(`Could not locate page content in ${name}.html`);
  }
  return html.slice(start, end).trim();
}

function rewriteLinks(markup) {
  const slugs = new Set(pages.filter((page) => page !== "index"));
  return markup
    .replace(/class="breadcrumb"/g, 'class="africon-breadcrumb"')
    .replace(/href="index\.html(#[^"]*)?"/g, (_match, hash = "") => `href="${siteBase}/${hash}"`)
    .replace(/href="([a-z-]+)\.html(#[^"]*)?"/g, (match, slug, hash = "") =>
      slugs.has(slug) ? `href="${siteBase}/${wordpressSlugs[slug] || slug}/${hash}"` : match,
    )
    .replace(/action="form-handler\.php"/g, 'action="/form-handler.php"')
    .replace(/assets\/images\//g, `${uploadsBase}/`);
}

function inlineStyles(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => `<style>${match[1]}</style>`)
    .join("\n");
}

function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => `<script>${match[1]}</script>`)
    .join("\n");
}

fs.mkdirSync(outputDir, { recursive: true });

const existingAbout = fs.readFileSync(path.join(outputDir, "about.txt"), "utf8");
const baseStyleMatch = existingAbout.match(/^([\s\S]*?\[\/vc_raw_html\])/);
if (!baseStyleMatch) {
  throw new Error("Could not recover the shared WordPress page styles from about.txt");
}
const sharedStyleBlock = removeHeaderOverlap(baseStyleMatch[1]);

for (const name of pages) {
  const sourcePath = path.join(root, `${name}.html`);
  const html = fs.readFileSync(sourcePath, "utf8");
  const content = rewriteLinks(pageContent(name, html));
  const styles = name === "index"
    ? `<style>${rewriteLinks(fs.readFileSync(path.join(root, "assets/css/wordpress-home.css"), "utf8"))}</style>`
    : inlineStyles(html);
  const scripts = [
    inlineScripts(html),
    name === "index"
      ? `<script>${fs.readFileSync(path.join(root, "assets/js/main.js"), "utf8")}</script>`
      : "",
  ].filter(Boolean).join("\n");
  const cssBlock = styles ? `\n${encodedRawHtml(styles)}` : "";
  const scriptBlock = scripts ? `\n${encodedRawHtml(scripts)}` : "";
  const wrapperClass = name === "index" ? "africon-home" : `africon-${name}`;
  const wrappedContent = `<div class="africon-page ${wrapperClass}">\n${content}\n</div>`;
  const contentBlock = rawContentPages.has(name)
    ? encodedRawHtml(wrappedContent)
    : `[vc_column_text css=".vc_custom_${wrapperClass.replace(/-/g, "_")}{margin:0 !important;padding:0 !important;}\"]\n${wrappedContent}\n[/vc_column_text]`;
  const shortcode = `${sharedStyleBlock}${cssBlock}\n${contentBlock}${scriptBlock}\n[/vc_column][/vc_row]\n`;
  fs.writeFileSync(path.join(outputDir, `${name}.txt`), shortcode, "utf8");
}

console.log(`Built ${pages.length} WordPress page templates.`);
