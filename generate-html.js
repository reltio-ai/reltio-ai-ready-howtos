#!/usr/bin/env node

/**
 * generate-html.js
 *
 * Converts HOWTO markdown files into single, self-contained HTML files.
 *
 * Output layout — one flat folder:
 *   howtos-html/
 *     index.html                                    Landing page (links to every guide)
 *     DISCLAIMER.html                               Single shared disclaimer
 *     HOWTO-configure-surrogate-keys.html           One file per guide, named after the MD source
 *     HOWTO-use-reltio-canonical-models-...html
 *     ...
 *
 * Every guide HTML has:
 *   - CSS embedded inline in <head>
 *   - Mermaid diagrams and referenced SVGs inlined as base64 data URIs
 *   - Links to the shared DISCLAIMER.html and to sibling HOWTOs
 *
 * Usage:
 *   node generate-html.js                            # Rebuild all guides + landing + disclaimer
 *   node generate-html.js howtos/HOWTO-foo.md        # Rebuild one guide
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { marked } = require("marked");
const hljs = require("highlight.js");

const REPO_ROOT = __dirname;
const HOWTOS_DIR = path.join(REPO_ROOT, "howtos");
const OUTPUT_DIR = path.join(REPO_ROOT, "howtos-html");
const TEMPLATE_DIR = path.join(REPO_ROOT, "html-template");
const DISCLAIMER_MD = path.join(REPO_ROOT, "DISCLAIMER.md");
const README_MD = path.join(REPO_ROOT, "README.md");
const MMDC = path.join(REPO_ROOT, "node_modules", ".bin", "mmdc");

const MERMAID_CONFIG = {
  theme: "base",
  themeVariables: {
    primaryColor: "#000066",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#000033",
    lineColor: "#000033",
    // textColor alone is NOT enough — Mermaid's base theme still paints edge
    // labels with primaryTextColor. The themeCSS block below is the bulletproof
    // fix because it injects raw CSS with !important into the rendered SVG.
    textColor: "#000033",
    secondaryColor: "#f5f5f5",
    tertiaryColor: "#f0f4ff",
    edgeLabelBackground: "#f0f4ff",
    clusterBkg: "#f0f4ff",
    clusterBorder: "#0000CC",
    fontSize: "14px",
  },
  // Raw CSS injected into the SVG — overrides any theme-variable inheritance.
  // This guarantees edge labels render as dark text on the soft-blue cluster
  // background, matching the visual language of subgraphs.
  themeCSS: ".edgeLabel { color: #000033 !important; background-color: #f0f4ff !important; font-weight: 500 !important; } .edgeLabel rect, .edgeLabel foreignObject { fill: #f0f4ff !important; }",
  flowchart: {
    curve: "basis",
    padding: 12,
    nodeSpacing: 40,
    rankSpacing: 55,
  },
};

const MERMAID_CONFIG_PATH = path.join(REPO_ROOT, ".mermaid-config.generate-html.json");

// --- Markdown → HTML configuration ---

marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false });

const renderer = {
  code(token) {
    const code = token.text;
    const language = (token.lang || "").trim();
    let highlighted;
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
    const langClass = language ? ` class="language-${language} hljs"` : ` class="hljs"`;
    return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
  },
  heading(token) {
    const inner = this.parser.parseInline(token.tokens);
    const slug = slugify(token.text);
    return `<h${token.depth} id="${slug}">${inner}</h${token.depth}>\n`;
  },
};
marked.use({ renderer });

// --- Helpers ---

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeMermaidConfig() {
  fs.writeFileSync(MERMAID_CONFIG_PATH, JSON.stringify(MERMAID_CONFIG, null, 2));
}

function cleanupMermaidConfig() {
  if (fs.existsSync(MERMAID_CONFIG_PATH)) fs.unlinkSync(MERMAID_CONFIG_PATH);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractTitle(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  if (!m) return "Reltio HOWTO";
  // Strip leading "HOWTO:" prefix — README rows use the plain topic title.
  return m[1].trim().replace(/^HOWTO:\s*/i, "");
}

// Convert inline markdown to plain text for use inside a README table cell.
// Strips links (keeping the text), strips code backticks, bold/italic markers,
// and collapses whitespace so the result renders cleanly as a one-line cell.
function markdownToPlainText(md) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/`([^`]+)`/g, "$1") // `code` → code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1") // *italic* → italic
    .replace(/_([^_]+)_/g, "$1") // _italic_ → italic
    .replace(/\s+/g, " ")
    .trim();
}

function svgToDataUri(svgContent) {
  // Strip XML prolog / DOCTYPE so the base64 is just the <svg> root
  const stripped = svgContent
    .replace(/<\?xml[\s\S]*?\?>\s*/i, "")
    .replace(/<!DOCTYPE[\s\S]*?>\s*/i, "")
    .trim();
  const b64 = Buffer.from(stripped, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

// --- Diagram and image inlining ---

function renderMermaidToTempSvg(mermaidCode) {
  const cleanCode = mermaidCode.replace(/%%\{init:[\s\S]*?\}%%\s*/, "");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpInput = path.join(REPO_ROOT, `.tmp-diagram-${stamp}.mmd`);
  const tmpOutput = path.join(REPO_ROOT, `.tmp-diagram-${stamp}.svg`);
  fs.writeFileSync(tmpInput, cleanCode);
  try {
    execSync(
      `"${MMDC}" -i "${tmpInput}" -o "${tmpOutput}" -c "${MERMAID_CONFIG_PATH}" -b transparent -w 900`,
      { stdio: "pipe", timeout: 45000 }
    );
    const svg = fs.readFileSync(tmpOutput, "utf-8");
    return svg;
  } catch (err) {
    console.error(`    Mermaid render failed: ${err.message.split("\n")[0]}`);
    return null;
  } finally {
    if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
    if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
  }
}

function inlineMermaidBlocks(markdown) {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const diagrams = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    diagrams.push({ full: match[0], code: match[1].trim() });
  }

  let updated = markdown;
  for (const d of diagrams) {
    const svg = renderMermaidToTempSvg(d.code);
    if (svg) {
      const dataUri = svgToDataUri(svg);
      const imgHtml = `<img class="diagram" src="${dataUri}" alt="Workflow diagram" />`;
      updated = updated.replace(d.full, imgHtml);
    } else {
      updated = updated.replace(d.full, "```text\n" + d.code + "\n```");
    }
  }
  return updated;
}

function inlineReferencedImages(markdown) {
  // ![alt](images/foo.svg) → <img class="diagram" src="data:...base64..." alt="alt" />
  const imgRegex = /!\[([^\]]*)\]\(images\/([^)]+)\)/g;
  return markdown.replace(imgRegex, (full, alt, filename) => {
    const srcPath = path.join(HOWTOS_DIR, "images", filename);
    if (!fs.existsSync(srcPath)) {
      console.warn(`    missing image: ${filename}`);
      return full;
    }
    if (filename.toLowerCase().endsWith(".svg")) {
      const svg = fs.readFileSync(srcPath, "utf-8");
      const dataUri = svgToDataUri(svg);
      return `<img class="diagram" src="${dataUri}" alt="${escapeHtml(alt)}" />`;
    }
    // Raster fallback — base64 the bytes
    const mime = filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")
      ? "image/jpeg"
      : "application/octet-stream";
    const b64 = fs.readFileSync(srcPath).toString("base64");
    return `<img class="diagram" src="data:${mime};base64,${b64}" alt="${escapeHtml(alt)}" />`;
  });
}

// --- Link rewriting ---

function rewriteLinks(html) {
  // Flat layout: every generated file lives in howtos-html/ directly.
  //   - ../DISCLAIMER.md                   → DISCLAIMER.html
  //   - ../README.md                       → index.html (landing page)
  //   - HOWTO-other.md (any relative form) → HOWTO-other.html
  //   - #anchor or https://…               → unchanged
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#")) {
      return m;
    }
    if (href === "../DISCLAIMER.md") return `href="DISCLAIMER.html"`;
    if (href === "../README.md" || href === "../README.md#") return `href="index.html"`;

    // Any HOWTO-*.md reference (plain, ./, or howtos/) → sibling HOWTO-*.html
    const m1 = href.match(/^(?:\.\/|howtos\/)?(HOWTO-[^.#]+)\.md(#.*)?$/);
    if (m1) return `href="${m1[1]}.html${m1[2] || ""}"`;

    // Generic .md → .html fallback
    if (href.endsWith(".md")) return `href="${href.replace(/\.md$/, ".html")}"`;
    return m;
  });
}

function flagDisclaimerBlockquote(html) {
  const lastIdx = html.lastIndexOf("<blockquote>");
  if (lastIdx < 0) return html;
  return html.slice(0, lastIdx) + `<blockquote class="disclaimer">` + html.slice(lastIdx + "<blockquote>".length);
}

// --- HTML wrapping ---

function wrapHtml(title, bodyHtml, css) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${bodyHtml}
<script>
  // Click-to-zoom for workflow diagrams — toggle zoomed class on click,
  // dismiss on second click or by clicking anywhere outside the diagram.
  document.querySelectorAll('.diagram').forEach(function (img) {
    img.addEventListener('click', function (e) {
      e.stopPropagation();
      img.classList.toggle('zoomed');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.diagram.zoomed').forEach(function (img) {
      img.classList.remove('zoomed');
    });
  });
</script>
</body>
</html>
`;
}

function loadCss() {
  return fs.readFileSync(path.join(TEMPLATE_DIR, "styles.css"), "utf-8");
}

// --- HOWTO processing ---

function processHowto(mdFilePath, css) {
  const baseName = path.basename(mdFilePath, ".md"); // HOWTO-foo
  const outputFile = path.join(OUTPUT_DIR, `${baseName}.html`);

  let md = fs.readFileSync(mdFilePath, "utf-8");
  const title = extractTitle(md);

  // Inline all images: pre-rendered SVGs first, then Mermaid code blocks
  md = inlineReferencedImages(md);
  md = inlineMermaidBlocks(md);

  let html = marked.parse(md);
  html = rewriteLinks(html);
  html = flagDisclaimerBlockquote(html);

  fs.writeFileSync(outputFile, wrapHtml(title, html, css));
  return { baseName, title, outputFile };
}

function buildDisclaimerPage(css) {
  const md = fs.readFileSync(DISCLAIMER_MD, "utf-8");
  const title = extractTitle(md);
  let html = marked.parse(md);
  html = html.replace(/href="([^"]+\.md)"/g, (m, h) => {
    if (h.endsWith("README.md")) return `href="index.html"`;
    return `href="${h.replace(/\.md$/, ".html")}"`;
  });
  const outputFile = path.join(OUTPUT_DIR, "DISCLAIMER.html");
  fs.writeFileSync(outputFile, wrapHtml(title, html, css));
  return outputFile;
}

function buildLandingPage(css) {
  const readme = fs.readFileSync(README_MD, "utf-8");

  const tableMatch = readme.match(/## Guides \(\d+\)\s*\n\n([\s\S]*?)\n\n##/);
  if (!tableMatch) {
    console.warn("  Could not find the Guides table in README.md — skipping landing page.");
    return null;
  }

  // Rewrite the table's .md links → sibling .html files
  const tableMd = tableMatch[1].replace(
    /\]\(howtos\/(HOWTO-[^)]+)\.md\)/g,
    "]($1.html)"
  );
  const tableHtml = marked.parse(tableMd);

  const header = `
    <header class="site-header">
      <h1>Reltio HOWTOs</h1>
      <div class="subtitle">HTML-rendered versions of the Reltio HOWTO guides. Each guide is a single, self-contained HTML file — open any of them directly.</div>
    </header>
  `;
  const footerNote = `
    <p style="margin-top:2rem; color:var(--text-muted); font-size:0.9em;">
      For the shared disclaimer covering all guides, see <a href="DISCLAIMER.html">DISCLAIMER.html</a>.
    </p>
  `;

  const body = header + tableHtml + footerNote;
  const outputFile = path.join(OUTPUT_DIR, "index.html");
  fs.writeFileSync(outputFile, wrapHtml("Reltio HOWTOs", body, css));
  return outputFile;
}

// --- Cleanup: remove old folder-based output if it exists ---

function cleanupOldFolderOutput() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const entry of fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith("HOWTO-")) {
      fs.rmSync(path.join(OUTPUT_DIR, entry.name), { recursive: true, force: true });
    }
    // Remove the old top-level styles.css (no longer needed — CSS is embedded)
    if (entry.isFile() && entry.name === "styles.css") {
      fs.unlinkSync(path.join(OUTPUT_DIR, entry.name));
    }
  }
}

// --- README auto-update for new HOWTOs ---
//
// When `generate-html.js` is invoked with one or more specific HOWTO files
// (the new-guide flow), append a row to the `## Guides (N)` table in
// README.md and increment the counter. Idempotent — if the guide's
// basename is already referenced in the table, skip without duplicating.
//
// Extracted automatically:
//   - Title         from the `.md` first `# ` heading
//   - Description   first sentence of the `## Overview` section
//                   (audience line "This guide is for …" is skipped)
//   - Author        from $HOWTO_AUTHOR, or `git config user.displayName`,
//                   falling back to `git config user.name`
//   - Date          today in DD-MMM-YYYY
//
// Run with no args (full rebuild) does NOT touch README — it's a pure
// regeneration of the HTML output.

function extractOverviewSentence(markdown) {
  const overviewMatch = markdown.match(/##\s+Overview\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n|$)/);
  if (!overviewMatch) return null;
  const body = overviewMatch[1].trim();
  // Split into paragraphs; drop audience line; take first real paragraph.
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => !/^This guide is for /i.test(p));
  if (paragraphs.length === 0) return null;
  // Flatten inline line breaks inside the paragraph, then strip markdown
  // so the cell renders as plain text in the README table.
  const firstPara = markdownToPlainText(paragraphs[0]);
  // Extract first sentence — greedy up to ". ", "! ", "? ", or end of string.
  const sentenceMatch = firstPara.match(/^(.+?[.!?])(\s|$)/);
  return (sentenceMatch ? sentenceMatch[1] : firstPara).trim();
}

// Resolve the author name for the README row.
// Priority (first non-empty wins):
//   1. $HOWTO_AUTHOR               — per-run override (e.g. CI or explicit invocation)
//   2. git log original committer  — reads the person who first committed this file;
//                                    reliable for files already in history and avoids
//                                    picking up a local git config that differs from
//                                    the actual contributor (fixes "Unknown" on rebuild)
//   3. `git config user.displayName` — repo-local display name (new files, not yet committed)
//   4. `git config user.name`        — default git identity
//   5. "Unknown"
function getFileCommitAuthor(mdFilePath) {
  try {
    const rel = path.relative(REPO_ROOT, mdFilePath);
    // Use spawnSync (no shell) so the path is passed as a literal argument,
    // not interpolated into a shell string — eliminates the injection surface.
    const result = spawnSync(
      "git",
      ["log", "--follow", "--diff-filter=A", '--format=%an', "--", rel],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    );
    if (result.status !== 0 || !result.stdout) return null;
    const name = result.stdout.trim().split("\n")[0].trim();
    return name || null;
  } catch {
    return null;
  }
}

function getGitUserName() {
  if (process.env.HOWTO_AUTHOR && process.env.HOWTO_AUTHOR.trim()) {
    return process.env.HOWTO_AUTHOR.trim();
  }
  const tryConfig = (key) => {
    try {
      const v = execSync(`git config ${key}`, {
        cwd: REPO_ROOT,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return v || null;
    } catch {
      return null;
    }
  };
  return tryConfig("user.displayName") || tryConfig("user.name") || null;
}

function formatTodayDate() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = months[now.getMonth()];
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function updateReadmeForNewGuide(mdFilePath, title) {
  const baseName = path.basename(mdFilePath, ".md");
  const readme = fs.readFileSync(README_MD, "utf-8");

  // Idempotency — if this guide's path is already referenced, don't add again.
  if (readme.includes(`(howtos/${baseName}.md)`)) {
    return { added: false, reason: "already in README" };
  }

  const md = fs.readFileSync(mdFilePath, "utf-8");
  const description =
    extractOverviewSentence(md) || "(description pending — edit README row)";
  const author = getFileCommitAuthor(mdFilePath) || getGitUserName() || "Unknown";
  const date = formatTodayDate();

  // Find the "## Guides (N)" heading.
  const headingRegex = /^## Guides \((\d+)\)$/m;
  const headingMatch = readme.match(headingRegex);
  if (!headingMatch) {
    return { added: false, reason: "could not find '## Guides (N)' heading" };
  }
  const currentCount = parseInt(headingMatch[1], 10);

  // Find the highest plain row number (ignore suffixes like "1a", "2a").
  const rowNumberRegex = /^\|\s*(\d+)[a-z]?\s*\|/gm;
  let lastRowNumber = 0;
  let m;
  while ((m = rowNumberRegex.exec(readme)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > lastRowNumber) lastRowNumber = n;
  }
  const newNumber = lastRowNumber + 1;

  const newRow = `| ${newNumber} | [${title}](howtos/${baseName}.md) | ${description} | ${author} | ${date} |`;

  // Insert the new row immediately after the last existing table row.
  const lines = readme.split("\n");
  let lastRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*\d+[a-z]?\s*\|/.test(lines[i])) lastRowIdx = i;
  }
  if (lastRowIdx < 0) {
    return { added: false, reason: "could not locate last table row" };
  }
  lines.splice(lastRowIdx + 1, 0, newRow);

  // Increment the `(N)` counter in the heading.
  const updated = lines
    .join("\n")
    .replace(headingRegex, `## Guides (${currentCount + 1})`);

  fs.writeFileSync(README_MD, updated);
  return { added: true, number: newNumber, description, author, date };
}

// --- Lint: enforce current platform name ---
//
// Per STYLE-GUIDE.md rule G6, "Reltio Data Cloud" is a retired brand name
// that must never appear in any HOWTO. The correct name is
// "Reltio Context Intelligence Platform". The docs corpus predates the
// rename and still contains the old string — this check ensures it never
// slips through into published HTML.

function lintPlatformName(files) {
  const BANNED = "Reltio Data Cloud";
  const violations = [];
  for (const mdPath of files) {
    const content = fs.readFileSync(mdPath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(BANNED)) {
        violations.push({
          file: path.relative(REPO_ROOT, mdPath),
          line: i + 1,
          content: lines[i].trim().slice(0, 120),
        });
      }
    }
  }
  return violations;
}

// --- Lint: enforce landscape (LR) flowcharts ---
//
// Per STRUCTURE-GUIDE.md rule A4, every Mermaid flowchart must declare
// `flowchart LR`. Portrait diagrams (`flowchart TD`) render poorly inside
// GitHub's fixed-width markdown column — tall narrow ribbons push the first
// body section below the fold and compress node labels. For long linear
// flows, authors should wrap into LR subgraph rows, not flip to portrait.
//
// This check runs before any HTML is generated so violations fail fast
// with a clear pointer to the offending file and line.

function lintFlowchartDirection(files) {
  const violations = [];
  for (const mdPath of files) {
    const content = fs.readFileSync(mdPath, "utf-8");
    const lines = content.split("\n");
    let inMermaidBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "```mermaid") {
        inMermaidBlock = true;
        continue;
      }
      if (inMermaidBlock && line.trim().startsWith("```")) {
        inMermaidBlock = false;
        continue;
      }
      if (inMermaidBlock && /^\s*flowchart\s+TD\b/.test(line)) {
        violations.push({
          file: path.relative(REPO_ROOT, mdPath),
          line: i + 1,
          content: line.trim(),
        });
      }
    }
  }
  return violations;
}

// --- Path validation ---

function validateHowtoPath(filePath) {
  const resolved = path.resolve(filePath);
  const allowedDir = path.resolve(HOWTOS_DIR) + path.sep;
  if (!resolved.startsWith(allowedDir)) {
    throw new Error(
      `Path traversal rejected: "${filePath}" is outside howtos/`
    );
  }
  if (!/^HOWTO-.+\.md$/.test(path.basename(resolved))) {
    throw new Error(
      `Invalid file: "${filePath}" must match the HOWTO-*.md pattern`
    );
  }
  return resolved;
}

// --- Main ---

function getTargetFiles(args) {
  if (args.length > 0) return args.map((f) => validateHowtoPath(f));
  return fs
    .readdirSync(HOWTOS_DIR)
    .filter((f) => f.startsWith("HOWTO-") && f.endsWith(".md"))
    .map((f) => path.join(HOWTOS_DIR, f));
}

function main() {
  const args = process.argv.slice(2);
  const files = getTargetFiles(args);

  console.log(`\nReltio HOWTO — HTML Generator`);
  console.log(`============================\n`);

  // Lint: banned platform name — see STYLE-GUIDE.md rule G6.
  const nameViolations = lintPlatformName(files);
  if (nameViolations.length > 0) {
    console.error(`\n✗ Platform name lint failed: ${nameViolations.length} violation(s) — "Reltio Data Cloud" is a retired brand name.\n`);
    for (const v of nameViolations) {
      console.error(`  ${v.file}:${v.line}  ${v.content}`);
    }
    console.error(`\nSTYLE-GUIDE.md rule G6: always write "Reltio Context Intelligence Platform".`);
    console.error(`The docs corpus predates the rename — do not copy the old name from it.\n`);
    console.error(`HTML generation aborted. Fix the file(s) and re-run.\n`);
    process.exit(1);
  }

  // Lint: no portrait flowcharts allowed — see STRUCTURE-GUIDE.md rule A4.
  const violations = lintFlowchartDirection(files);
  if (violations.length > 0) {
    console.error(`\n✗ Mermaid lint failed: ${violations.length} violation(s) — use \`flowchart LR\` instead of \`flowchart TD\`.\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.content}`);
    }
    console.error(`\nSTRUCTURE-GUIDE.md rule A4: always use landscape. For long linear flows,`);
    console.error(`wrap into LR subgraph rows instead of flipping to portrait.\n`);
    console.error(`HTML generation aborted. Fix the Mermaid block(s) and re-run.\n`);
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);
  if (args.length === 0) cleanupOldFolderOutput();
  writeMermaidConfig();

  const css = loadCss();
  const processed = [];

  for (const mdPath of files) {
    const name = path.basename(mdPath);
    console.log(`Rendering: ${name}`);
    try {
      const result = processHowto(mdPath, css);
      processed.push(result);
      console.log(`  → howtos-html/${result.baseName}.html`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // README auto-update — runs only for explicit-file invocations
  // (the new-guide flow). Full rebuild (`node generate-html.js` with no
  // args) is pure regeneration and never touches README.
  let readmeUpdated = false;
  if (args.length > 0 && processed.length > 0) {
    console.log(`\nREADME auto-update...`);
    for (const result of processed) {
      const mdPath = files.find(
        (f) => path.basename(f, ".md") === result.baseName
      );
      if (!mdPath) continue;
      const update = updateReadmeForNewGuide(mdPath, result.title);
      if (update.added) {
        readmeUpdated = true;
        console.log(
          `  ✓ ${result.baseName}: row #${update.number} added (${update.author}, ${update.date})`
        );
        console.log(`      description: ${update.description}`);
      } else {
        console.log(`  • ${result.baseName}: skipped — ${update.reason}`);
      }
    }
  }

  if (args.length === 0 || readmeUpdated) {
    console.log(`\nBuilding shared pages...`);
    const disc = buildDisclaimerPage(css);
    if (disc) console.log(`  → howtos-html/${path.basename(disc)}`);
    const landing = buildLandingPage(css);
    if (landing) console.log(`  → howtos-html/${path.basename(landing)}`);
  }

  cleanupMermaidConfig();

  console.log(`\nDone: ${processed.length}/${files.length} HOWTOs rendered to howtos-html/.\n`);
}

main();
