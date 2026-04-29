#!/usr/bin/env node

/**
 * generate-diagrams.js
 *
 * Extracts Mermaid code blocks from HOWTO markdown files, renders them as SVG
 * images using the Mermaid CLI, and replaces the code blocks with image references.
 *
 * Usage:
 *   node generate-diagrams.js                          # Process all howtos/*.md
 *   node generate-diagrams.js howtos/HOWTO-foo.md      # Process a single file
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const IMAGES_DIR = path.join(__dirname, "howtos", "images");
const MMDC = path.join(__dirname, "node_modules", ".bin", "mmdc");

// Mermaid CLI config: Reltio brand colors, compact output
const MERMAID_CONFIG = {
  theme: "base",
  themeVariables: {
    primaryColor: "#0057B8",
    primaryTextColor: "#ffffff",
    lineColor: "#333333",
    secondaryColor: "#f4f4f4",
    tertiaryColor: "#e8e8e8",
    edgeLabelBackground: "#ffffff",
  },
};

// CSS injected into the SVG to fix edge label contrast
const SVG_CSS_FIX = `
  .edgeLabel .label span { color: #333333 !important; fill: #333333 !important; }
  .edgeLabel .label { color: #333333 !important; }
`;

const CONFIG_PATH = path.join(__dirname, ".mermaid-config.json");

function ensureDirectories() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

function writeConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(MERMAID_CONFIG, null, 2));
}

const HOWTOS_DIR = path.join(__dirname, "howtos");

function validateHowtoPath(filePath) {
  const resolved = path.resolve(filePath);
  const allowedDir = HOWTOS_DIR + path.sep;
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

function getTargetFiles(args) {
  if (args.length > 0) {
    return args.map((f) => validateHowtoPath(f));
  }
  // Default: all HOWTO markdown files
  return fs
    .readdirSync(HOWTOS_DIR)
    .filter((f) => f.startsWith("HOWTO-") && f.endsWith(".md"))
    .map((f) => path.join(HOWTOS_DIR, f));
}

function extractMermaidBlocks(content) {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      fullMatch: match[0],
      code: match[1].trim(),
      index: match.index,
    });
  }
  return blocks;
}

function generateSlug(filePath, blockIndex) {
  const baseName = path.basename(filePath, ".md").toLowerCase();
  // Remove the HOWTO- prefix for cleaner image names
  const slug = baseName.replace(/^howto-/, "");
  if (blockIndex === 0) {
    return `${slug}-workflow`;
  }
  return `${slug}-diagram-${blockIndex + 1}`;
}

function renderDiagram(mermaidCode, outputPath) {
  // Strip the %%{init: ...}%% directive — config file handles theming
  const cleanCode = mermaidCode.replace(/%%\{init:[\s\S]*?\}%%\s*/, "");

  const tmpInput = path.join(__dirname, ".tmp-diagram.mmd");
  fs.writeFileSync(tmpInput, cleanCode);

  try {
    execSync(
      `"${MMDC}" -i "${tmpInput}" -o "${outputPath}" -c "${CONFIG_PATH}" -b transparent -w 800`,
      { stdio: "pipe", timeout: 30000 }
    );

    // Post-process SVG: fix edge label text color
    if (outputPath.endsWith(".svg") && fs.existsSync(outputPath)) {
      let svg = fs.readFileSync(outputPath, "utf-8");
      // Inject CSS fix for edge label contrast
      svg = svg.replace("</style>", `${SVG_CSS_FIX}</style>`);
      fs.writeFileSync(outputPath, svg);
    }

    return true;
  } catch (err) {
    console.error(`  Error rendering: ${err.message}`);
    return false;
  } finally {
    if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const blocks = extractMermaidBlocks(content);

  if (blocks.length === 0) {
    console.log(`  No Mermaid blocks found — skipping`);
    return { processed: 0, replaced: 0 };
  }

  let updatedContent = content;
  let replaced = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const slug = generateSlug(filePath, i);
    const svgFileName = `${slug}.svg`;
    const svgPath = path.join(IMAGES_DIR, svgFileName);
    const relativePath = `images/${svgFileName}`;

    console.log(`  Block ${i + 1}: rendering → ${svgFileName}`);

    if (renderDiagram(block.code, svgPath)) {
      // Build the alt text from the file name
      const altText = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const imageMarkdown = `![${altText}](${relativePath})`;
      updatedContent = updatedContent.replace(block.fullMatch, imageMarkdown);
      replaced++;
    }
  }

  if (replaced > 0) {
    fs.writeFileSync(filePath, updatedContent);
  }

  return { processed: blocks.length, replaced };
}

function cleanup() {
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  const files = getTargetFiles(args);

  console.log(`\nMermaid Diagram Generator`);
  console.log(`========================\n`);

  ensureDirectories();
  writeConfig();

  let totalProcessed = 0;
  let totalReplaced = 0;

  for (const filePath of files) {
    console.log(`Processing: ${path.basename(filePath)}`);
    const { processed, replaced } = processFile(filePath);
    totalProcessed += processed;
    totalReplaced += replaced;
  }

  cleanup();

  console.log(`\nDone: ${totalReplaced}/${totalProcessed} diagrams rendered.`);
  console.log(`Images saved to: howtos/images/\n`);
}

main();
