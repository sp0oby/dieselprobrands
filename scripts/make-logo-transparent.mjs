// One-shot: turn public/dpb-logo.jpg into public/dpb-logo.png with the white
// background keyed out. Near-white pixels become fully transparent; pixels in
// the threshold band fade out so anti-aliased edges don't leave a halo.
//
// Run from the project root:  node scripts/make-logo-transparent.mjs
import sharp from "sharp";

const SRC = "public/dpb-logo.jpg";
const OUT = "public/dpb-logo.png";

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const out = Buffer.alloc(data.length);

const THRESHOLD = 235;
const HARD_WHITE = 250;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const minC = Math.min(r, g, b);
  let alpha = 255;
  if (minC >= HARD_WHITE) {
    alpha = 0;
  } else if (minC >= THRESHOLD) {
    alpha = Math.round(255 * (HARD_WHITE - minC) / (HARD_WHITE - THRESHOLD));
  }
  out[i] = r;
  out[i + 1] = g;
  out[i + 2] = b;
  out[i + 3] = alpha;
}

await sharp(out, { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`wrote ${OUT} (${width}x${height})`);
