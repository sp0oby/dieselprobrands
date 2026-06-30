// Convert the supplied brand .webp logos to transparent PNGs and drop them
// into public/brands/{slug}.png where {slug} matches the brand slug used in
// src/lib/site.ts. BrandLogo auto-picks them up — no other wiring needed.
//
// Source folder: C:/Users/brand/OneDrive/Desktop/brands/
//
// Run from project root:  node scripts/convert-brand-logos.mjs
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "C:/Users/brand/OneDrive/Desktop/brands";
const OUT_DIR = "public/brands";

// Map of input filename (without extension, lowercased) -> output slug.
// Anything not listed is skipped with a warning so a stray file in the
// source folder doesn't silently land somewhere unexpected.
const SLUG = {
  "bosch": "bosch",
  "cat": "caterpillar",
  "cnh": "cnh",
  "cummings": "cummins",      // source file is misspelled
  "denso": "denso",
  "detroitdiesel": "detroit-diesel",
  "deutz": "deutz",
  "doosan": "doosan",
  "fuso": "fuso",
  "general motors": "gm",
  "isuzu": "isuzu",
  "iveco": "iveco",
  "johndeer": "john-deere",
  "kobelco": "kobelco",
  "komatsu": "komatsu",
  "kubota": "kubota",
  "mack volvo": "mack-volvo",
  "mercedes benz": "mercedes-benz",
  "navistar": "navistar",
  "nissan": "nissan",
  "paccar": "paccar",
  "perkins": "perkins",
  "scania": "scania",
  "toyota": "toyota",
  "yan mar": "yanmar",
};

const THRESHOLD = 235;
const HARD_WHITE = 250;

async function convertOne(srcPath, outPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const minC = Math.min(r, g, b);
    let alpha = 255;
    if (minC >= HARD_WHITE) alpha = 0;
    else if (minC >= THRESHOLD) alpha = Math.round(255 * (HARD_WHITE - minC) / (HARD_WHITE - THRESHOLD));
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = alpha;
  }
  await sharp(out, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  return { width, height };
}

await fs.mkdir(OUT_DIR, { recursive: true });
const files = await fs.readdir(SRC_DIR);

let done = 0, skipped = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== ".webp" && ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") continue;
  const base = path.basename(file, ext).toLowerCase();
  const slug = SLUG[base];
  if (!slug) {
    console.warn(`skip: no slug mapping for "${file}"`);
    skipped++;
    continue;
  }
  const srcPath = path.join(SRC_DIR, file);
  const outPath = path.join(OUT_DIR, `${slug}.png`);
  const { width, height } = await convertOne(srcPath, outPath);
  console.log(`  ${file.padEnd(24)} -> ${slug}.png  (${width}x${height})`);
  done++;
}
console.log(`\nconverted ${done} logos, skipped ${skipped}`);
