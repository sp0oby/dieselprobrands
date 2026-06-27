#!/usr/bin/env node
// Best-effort brand-logo fetcher. Drops transparent PNGs into public/brands/{slug}.png.
// The BrandLogo component auto-detects files there and falls back to a styled wordmark
// (using the brand's signature color from src/lib/site.ts) if a file is missing.
//
// SOURCES tried in order (configurable via env):
//   LOGO_DEV_TOKEN   — your logo.dev publishable key (free tier: https://www.logo.dev)
//   BRANDFETCH_KEY   — Brandfetch client ID (free tier: https://brandfetch.com)
//   GOOGLE_FALLBACK  — set to "1" to use Google's 256px favicon as last resort (low-quality)
//
// Usage:
//   LOGO_DEV_TOKEN=pk_xxx node scripts/fetch-brand-logos.mjs
//
// Add or hand-curate logos at any time by saving:
//   public/brands/{slug}.png  (transparent PNG, 256+px tall)

import { writeFile, mkdir, access } from "fs/promises";
import { resolve } from "path";
import { pathToFileURL } from "url";

// Re-export BRANDS from the project src by reading the TS file textually (no compile needed).
async function loadBrands() {
  const { readFile } = await import("fs/promises");
  const src = await readFile(resolve("./src/lib/site.ts"), "utf8");
  const rows = [];
  const re = /\{\s*slug:\s*"([^"]+)".*?domain:\s*"([^"]+)"\s*\}/gs;
  let m;
  while ((m = re.exec(src)) !== null) rows.push({ slug: m[1], domain: m[2] });
  return rows;
}

const TOKEN = process.env.LOGO_DEV_TOKEN;
const BRANDFETCH = process.env.BRANDFETCH_KEY;
const USE_GOOGLE = process.env.GOOGLE_FALLBACK === "1";
const OUT = resolve("./public/brands");

async function fileExists(p) { try { await access(p); return true; } catch { return false; } }

async function tryLogoDev(domain) {
  if (!TOKEN) return null;
  const url = `https://img.logo.dev/${domain}?token=${TOKEN}&size=256&format=png`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) return null;
  return buf;
}

async function tryBrandfetch(domain) {
  if (!BRANDFETCH) return null;
  const url = `https://cdn.brandfetch.io/${domain}/w/256/h/256?c=${BRANDFETCH}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) return null;
  return buf;
}

async function tryGoogle(domain) {
  if (!USE_GOOGLE) return null;
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 512) return null;
  return buf;
}

await mkdir(OUT, { recursive: true });
const brands = await loadBrands();
console.log(`Found ${brands.length} brands with a domain set.\n`);

let ok = 0, skip = 0, fail = 0;
const missing = [];

for (const { slug, domain } of brands) {
  const out = resolve(OUT, `${slug}.png`);
  if (await fileExists(out)) { skip++; continue; }

  let buf = await tryLogoDev(domain).catch(() => null);
  if (!buf) buf = await tryBrandfetch(domain).catch(() => null);
  if (!buf) buf = await tryGoogle(domain).catch(() => null);

  if (buf) {
    await writeFile(out, buf);
    console.log(`  ✓ ${slug.padEnd(18)} (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } else {
    missing.push(slug);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 200));
}

console.log(`\nDone. ${ok} fetched, ${skip} already present, ${fail} missing.`);
if (missing.length) {
  console.log("\nMissing brands (drop a transparent PNG at public/brands/{slug}.png to fix):");
  for (const s of missing) console.log("  -", s);
  console.log("\nOr re-run with credentials:");
  console.log("  LOGO_DEV_TOKEN=pk_xxx node scripts/fetch-brand-logos.mjs");
  console.log("  BRANDFETCH_KEY=xxx     node scripts/fetch-brand-logos.mjs");
  console.log("  GOOGLE_FALLBACK=1      node scripts/fetch-brand-logos.mjs   (low quality)");
}
