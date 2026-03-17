#!/usr/bin/env node
/**
 * Reads all .svg files from public/icons/src/
 * and generates a single SVG sprite at public/icons/sprite.svg.
 *
 * Usage: node scripts/build-sprite.mjs
 *   or:  npm run icons
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const SRC_DIR = "public/icons/src";
const OUT_FILE = "public/icons/sprite.svg";

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".svg"));

if (files.length === 0) {
  console.error("No .svg files found in", SRC_DIR);
  process.exit(1);
}

const symbols = files.map((file) => {
  const name = basename(file, ".svg");
  const content = readFileSync(join(SRC_DIR, file), "utf8");

  // Extract viewBox from the root <svg> element
  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 12 12";

  // Extract inner content (everything between <svg ...> and </svg>)
  const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const inner = innerMatch ? innerMatch[1].trim() : "";

  return `  <symbol id="icon-${name}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
});

const sprite = [
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">`,
  ...symbols,
  `</svg>`,
].join("\n") + "\n";

writeFileSync(OUT_FILE, sprite, "utf8");
console.log(`✓ Sprite written to ${OUT_FILE} (${files.length} icons)`);
files.forEach((f) => console.log(`  · icon-${basename(f, ".svg")}`));
