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
  "call-for-reviewers",
  "committees",
  "contact",
  "program",
  "registration",
  "registration-policy",
  "speakers",
  "sponsors",
  "travel-support",
  "venue",
];
// WordPress applies wpautop to vc_column_text. Complex layouts must remain raw
// so injected paragraph elements cannot become slider or grid children.
const rawContentPages = new Set(pages);
const wordpressSlugs = { contact: "contact-us" };

function encodedRawHtml(value) {
  return `[vc_raw_html]${Buffer.from(value, "utf8").toString("base64")}[/vc_raw_html]`;
}

function removeHeaderOverlap(styleBlock) {
  return styleBlock.replace('el_id="no-top-space"', 'el_id="africon-page-row"').replace(
    /\[vc_raw_html\]([A-Za-z0-9+/=\s]+)\[\/vc_raw_html\]/,
    (_match, encodedStyles) => {
      const styles = Buffer.from(encodedStyles.trim(), "base64")
        .toString("utf8")
        .replace("margin-top:-95px!important;", "")
        .replace(/#no-top-space[^{}]*\{[^{}]*\}\s*/g, "")
        .replace(/\.entry-container:has\(\.africon-page\) > \.row:has\(#breadcrumbs\)\{[^{}]*\}/g, "")
        .replace(/\.africon-page \.africon-breadcrumb(?: a)?\{[^{}]*\}\s*/g, "");

      // The theme adds a separate breadcrumb row above the page content.
      // Use a unique content ID: the theme may also use no-top-space.
      // Hide only the breadcrumbs, never an ancestor that can contain navigation.
      const breadcrumbStyles = "\n#africon-page-row{position:relative!important;top:auto!important;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;pointer-events:auto!important;isolation:isolate;z-index:0}\n#africon-page-row>.vc_column_container>.vc_column-inner{padding-top:0!important}\n.entry-container:has(.africon-page) #breadcrumbs{display:none!important}\n";
      const paragraphStyles = "\n.africon-page .page-content p{width:100%!important;max-width:none!important;white-space:normal!important}\n";
      const fullWidthStyles = styles.includes(paragraphStyles.trim())
        ? styles : styles.replace("</style>", `${paragraphStyles}</style>`);
      const updatedStyles = fullWidthStyles.includes(breadcrumbStyles.trim())
        ? fullWidthStyles
        : fullWidthStyles.replace("</style>", `${breadcrumbStyles}</style>`);

      return encodedRawHtml(updatedStyles);
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
    // Registration popup is temporarily disabled; retain its source for later.
    return main;
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
    .replace(/<div class="breadcrumb">[\s\S]*?<\/div>/g, "")
    .replace(/class="breadcrumb"/g, 'class="africon-breadcrumb"')
    .replace(/href="index\.html(#[^"]*)?"/g, (_match, hash = "") => `href="${siteBase}/${hash}"`)
    .replace(/href="([a-z-]+)\.html(#[^"]*)?"/g, (match, slug, hash = "") =>
      slugs.has(slug) ? `href="${siteBase}/${wordpressSlugs[slug] || slug}/${hash}"` : match,
    )
    .replace(/action="form-handler\.php"/g, 'action="/form-handler.php"')
    .replace(/assets\/images\/sponsors\//g, `${uploadsBase}/`)
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
  let content = rewriteLinks(pageContent(name, html));
  if (name !== "index") {
    content = content.replace(/<div class="page-hero">\s*<div class="container">[\s\S]*?<\/div>\s*<\/div>\s*/, "");
  }
  const styles = name === "index"
    ? `<style>${rewriteLinks(fs.readFileSync(path.join(root, "assets/css/wordpress-home.css"), "utf8"))}</style>`
    : inlineStyles(html);
  const scripts = [
    name === "registration" ? "" : inlineScripts(html),
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
