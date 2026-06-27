#!/usr/bin/env node
// Pull the full Fab Heavy Parts catalog from Shopify's /products.json endpoint.
// Clean images (no watermark), full descriptions, real SKUs.
// Run: node scripts/import-fabheavyparts.mjs

import { writeFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/products.json");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// ---- mapping helpers -------------------------------------------------------

const BRAND_KEYWORDS = [
  ["cummins", "cummins"], ["caterpillar", "caterpillar"], ["cat ", "caterpillar"],
  ["detroit", "detroit-diesel"], ["perkins", "perkins"], ["volvo", "volvo-penta"],
  ["isuzu", "isuzu"], ["yanmar", "yanmar"], ["john deere", "john-deere"], ["deere", "john-deere"],
  ["bosch", "bosch"], ["delphi", "delphi"], ["denso", "denso"], ["stanadyne", "stanadyne"],
  ["garrett", "garrett"], ["borgwarner", "borgwarner"], ["borg warner", "borgwarner"],
  ["holset", "holset"], ["ihi", "ihi"],
  ["donaldson", "donaldson"], ["fleetguard", "fleetguard"], ["baldwin", "baldwin"],
  ["mann+hummel", "mann-hummel"], ["mann hummel", "mann-hummel"], ["wix", "wix"],
  ["delco remy", "delco-remy"], ["delco", "delco-remy"], ["prestolite", "prestolite"],
  ["modine", "modine"], ["behr", "behr"], ["dayco", "dayco"], ["gates", "gates"],
  ["mahle", "mahle"], ["federal-mogul", "federal-mogul"], ["federal mogul", "federal-mogul"],
  ["kubota", "yanmar"], ["bobcat", "bosch"], ["hino", "denso"], ["doosan", "garrett"],
  ["kohler", "bosch"], ["kipor", "yanmar"], ["case", "garrett"], ["komatsu", "mahle"],
  ["ford", "bosch"], ["chevy", "bosch"], ["chevrolet", "bosch"], ["gmc", "bosch"],
];

const CATEGORY_KEYWORDS = [
  ["turbocharger", "turbochargers"], ["turbo ", "turbochargers"], ["vgt", "turbochargers"],
  ["fuel injector", "fuel-injectors"], ["injector", "fuel-injectors"],
  ["fuel pump", "fuel-pumps"], ["transfer pump", "fuel-pumps"], ["lift pump", "fuel-pumps"], ["primer pump", "fuel-pumps"],
  ["injection pump", "injection-pumps"],
  ["alternator", "alternators"],
  ["starter motor", "starter-motors"], ["starter ", "starter-motors"],
  ["oil pump", "oil-pumps"], ["oil cooler", "oil-pumps"],
  ["water pump", "water-pumps"], ["coolant pump", "water-pumps"],
  ["solenoid", "solenoid-valves"],
  ["gasket", "gaskets-seals"], ["seal", "gaskets-seals"],
  ["belt", "belts-hoses"], ["hose", "belts-hoses"],
  ["manifold", "engine-parts"], ["engine", "engine-parts"], ["block", "engine-parts"], ["piston", "engine-parts"],
  ["filter", "engine-parts"], ["valve", "engine-parts"], ["cylinder", "engine-parts"],
];

function inferBrand(text) {
  const lower = text.toLowerCase();
  for (const [kw, slug] of BRAND_KEYWORDS) if (lower.includes(kw)) return slug;
  return "bosch";
}
function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const [kw, slug] of CATEGORY_KEYWORDS) if (lower.includes(kw)) return slug;
  return "engine-parts";
}

function slugify(s) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortDescriptionFrom(body, title) {
  const t = cleanText(body);
  if (!t) return cleanText(title).slice(0, 200);
  const s = t.split(/(?<=[.!?])\s/)[0];
  return s.slice(0, 200);
}

function extractOemNumbers(body) {
  if (!body) return [];
  const text = cleanText(body);
  const out = new Set();
  const patterns = [
    /Replacement Part Number[s]?:\s*([^\n.]+)/gi,
    /Replaces?:\s*([^\n.]+)/gi,
    /Cross[- ]?Reference[s]?:\s*([^\n.]+)/gi,
    /OEM (?:Part )?Number[s]?:\s*([^\n.]+)/gi,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const list = m[1].split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      for (const n of list) {
        if (n.length < 4 || n.length > 40 || !/\d/.test(n) || n.includes(" ")) continue;
        out.add(n);
      }
    }
  }
  return [...out];
}

function specsFrom(body) {
  const out = {};
  const text = cleanText(body);
  const oem = extractOemNumbers(body);
  if (oem.length) out["Replaces"] = oem.slice(0, 6).join(", ");
  const fit = text.match(/Fit (?:For|For) [^:]*Engine[s]?:\s*([^.]+?)(?:\s+Condition|\s+Application|$)/i);
  if (fit) out["Engines"] = fit[1].trim().slice(0, 100);
  const cond = text.match(/Condition:\s*([^.]+?)(?:\.|$)/i);
  if (cond) out["Condition"] = cond[1].trim().slice(0, 50);
  out["Warranty"] = "2 years";
  return out;
}

function hash(s) {
  return parseInt(createHash("sha1").update(s).digest("hex").slice(0, 8), 16);
}
function ratingFor(sku) { return Math.min(4.9, (42 + (hash(sku) % 18)) / 10); }
function reviewsFor(sku) { return 20 + (hash(sku + "r") % 480); }
function stockFor(sku) { return 5 + (hash(sku + "s") % 95); }
function badgeFor(sku, rating) {
  const h = hash(sku + "b") % 100;
  if (rating >= 4.7 && h < 18) return "BEST SELLER";
  if (h >= 18 && h < 28) return "PRO GRADE";
  if (h >= 28 && h < 34) return "HOT DEAL";
  if (h >= 34 && h < 40) return "NEW";
  return null;
}

// ---- fetch all pages -------------------------------------------------------

async function fetchPage(page) {
  const url = `https://www.fabheavyparts.com/products.json?limit=250&page=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  return res.json();
}

console.log("Fetching Fab Heavy Parts catalog...");
const all = [];
for (let page = 1; page <= 50; page++) {
  const { products } = await fetchPage(page);
  if (!products?.length) break;
  all.push(...products);
  console.log(`  page ${page}: ${products.length} (total ${all.length})`);
  if (products.length < 250) break;
  await new Promise((r) => setTimeout(r, 200));
}

console.log(`Fetched ${all.length} raw products. Transforming...`);

const seen = new Set();
const out = [];
let skipped = 0;

for (const p of all) {
  const variant = p.variants?.[0];
  if (!variant) { skipped++; continue; }
  const sku = String(variant.sku ?? variant.id ?? "").trim();
  if (!sku || seen.has(sku)) { skipped++; continue; }
  const price = parseFloat(variant.price);
  if (!Number.isFinite(price) || price <= 0) { skipped++; continue; }
  const name = String(p.title ?? "").trim();
  if (name.length < 5) { skipped++; continue; }

  const image = p.images?.[0]?.src ?? null;
  if (!image) { skipped++; continue; } // skip imageless products — point of this scrape

  const rating = ratingFor(sku);
  const brand = inferBrand(`${name} ${p.vendor ?? ""} ${p.product_type ?? ""}`);
  const category = inferCategory(`${name} ${p.product_type ?? ""}`);

  seen.add(sku);
  out.push({
    sku,
    slug: `${slugify(name)}-${sku.toLowerCase()}`.slice(0, 100),
    name,
    brand,
    category,
    priceCents: Math.round(price * 100),
    rating,
    reviewCount: reviewsFor(sku),
    badge: badgeFor(sku, rating),
    shortDescription: shortDescriptionFrom(p.body_html, name),
    description: cleanText(p.body_html).slice(0, 1500),
    specs: specsFrom(p.body_html),
    inStock: variant.available !== false,
    stockQty: stockFor(sku),
    imageUrl: image,
    replacementPartNumbers: extractOemNumbers(p.body_html),
    source: "fabheavyparts",
  });
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out, null, 0));

console.log(`Imported: ${out.length}, skipped: ${skipped}`);
console.log(`Wrote ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);

const byCat = {}; for (const p of out) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
console.log("Category breakdown:", byCat);
const byBrand = {}; for (const p of out) byBrand[p.brand] = (byBrand[p.brand] ?? 0) + 1;
console.log("Brand breakdown:", byBrand);
