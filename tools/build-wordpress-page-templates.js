const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "wordpress-page-templates");
const siteBase = "https://2027.ieee-africon.org";
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
const rawContentPages = new Set(["contact", "registration"]);
const wordpressSlugs = { contact: "contact-us" };

function encodedRawHtml(value) {
  return `[vc_raw_html]${Buffer.from(value, "utf8").toString("base64")}[/vc_raw_html]`;
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
    .replace(/action="form-handler\.php"/g, 'action="/form-handler.php"');
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
const sharedStyleBlock = baseStyleMatch[1];

for (const name of pages) {
  const sourcePath = path.join(root, `${name}.html`);
  const html = fs.readFileSync(sourcePath, "utf8");
  const content = rewriteLinks(pageContent(name, html));
  const styles = inlineStyles(html);
  const scripts = inlineScripts(html);
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
