#!/usr/bin/env node
/**
 * Generate PWA icon PNGs from the SVG source.
 * Run: npm install sharp && node scripts/generate-icons.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const INPUT = path.resolve(__dirname, "../public/icon.svg");
const OUTPUT_DIR = path.resolve(__dirname, "../public/icons");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const svg = fs.readFileSync(INPUT);

  for (const size of SIZES) {
    const out = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`  ✓ ${out}`);
  }

  // Badge icon for notifications (monochrome-ish, smaller)
  const badge = path.join(OUTPUT_DIR, "badge-72.png");
  await sharp(svg).resize(72, 72).png().toFile(badge);
  console.log(`  ✓ ${badge} (notification badge)`);

  console.log("\nDone! Icons written to public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
