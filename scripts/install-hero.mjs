// Convert a source hero image to public/hero.webp at high quality.
// Run from project root:  node scripts/install-hero.mjs <source-path>
import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/install-hero.mjs <source-image-path>");
  process.exit(1);
}

const out = "public/hero.webp";
const { width, height } = await sharp(src).metadata();
await sharp(src).webp({ quality: 90 }).toFile(out);
console.log(`wrote ${out} (${width}x${height}, aspect ${(width / height).toFixed(3)}:1)`);
