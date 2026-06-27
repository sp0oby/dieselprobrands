#!/usr/bin/env node
// One-shot importer: FridayParts JSON dump → src/data/products.json
// Run: node scripts/import-fridayparts.mjs <path-to-source.json>

import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] ?? resolve(
  __dirname,
  "../../DPB_2-20260627T173546Z-3-001/DPB_2/Scraping Data/Copy of fridayparts-sample-data.json",
);
const OUT = resolve(__dirname, "../src/data/products.json");

// ---- helpers ---------------------------------------------------------------

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
  ["modine", "modine"], ["behr", "behr"],
  ["dayco", "dayco"], ["gates", "gates"], ["mahle", "mahle"],
  ["federal-mogul", "federal-mogul"], ["federal mogul", "federal-mogul"],
  // suppliers / OEMs commonly mentioned but mapped to closest brand we have:
  ["kubota", "yanmar"], ["bobcat", "bosch"], ["hino", "denso"], ["doosan", "garrett"],
  ["kohler", "bosch"], ["kipor", "yanmar"], ["case", "garrett"], ["komatsu", "mahle"],
];

const CATEGORY_KEYWORDS = [
  ["turbocharger", "turbochargers"], ["turbo ", "turbochargers"], ["vgt ", "turbochargers"],
  ["fuel injector", "fuel-injectors"], ["injector", "fuel-injectors"],
  ["fuel pump", "fuel-pumps"], ["fuel transfer pump", "fuel-pumps"], ["lift pump", "fuel-pumps"], ["primer pump", "fuel-pumps"],
  ["injection pump", "injection-pumps"],
  ["alternator", "alternators"],
  ["starter motor", "starter-motors"], ["starter", "starter-motors"],
  ["oil pump", "oil-pumps"], ["oil cooler", "oil-pumps"],
  ["water pump", "water-pumps"], ["coolant pump", "water-pumps"],
  ["solenoid", "solenoid-valves"],
  ["gasket", "gaskets-seals"], ["seal", "gaskets-seals"],
  ["belt", "belts-hoses"], ["hose", "belts-hoses"],
  // fallbacks
  ["engine", "engine-parts"], ["block", "engine-parts"], ["piston", "engine-parts"],
  ["filter", "engine-parts"], ["air filter", "engine-parts"],
];

function inferBrand(name) {
  const lower = name.toLowerCase();
  for (const [kw, slug] of BRAND_KEYWORDS) if (lower.includes(kw)) return slug;
  return "bosch"; // safe default since we always carry Bosch
}

function inferCategory(name) {
  const lower = name.toLowerCase();
  for (const [kw, slug] of CATEGORY_KEYWORDS) if (lower.includes(kw)) return slug;
  return "engine-parts";
}

function parsePriceCents(s) {
  if (!s) return null;
  const m = String(s).match(/[\d,]+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanName(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-]+|[\s\-]+$/g, "")
    .slice(0, 220);
}

function shortDescription(details, fallback) {
  const text = String(details ?? fallback ?? "").trim();
  if (!text) return "Premium diesel part — OEM equivalent or better.";
  const firstSentence = text.split(/(?<=[.!?])\s/)[0];
  return firstSentence.slice(0, 200);
}

function specsFromDetails(details, replacements, models) {
  const out = {};
  if (Array.isArray(replacements) && replacements.length) {
    out["Replaces"] = replacements.slice(0, 4).join(", ");
  }
  if (Array.isArray(models) && models.length) {
    out["Fits"] = models.slice(0, 4).join(", ");
  }
  // try to extract "Fit for Engine: ..." or "Applications: ..." lines
  const text = String(details ?? "");
  const eng = text.match(/Fit for Engine:\s*([^\n]+?)(?:Applications|Fit|$)/i);
  if (eng) out["Engines"] = eng[1].trim().slice(0, 80);
  const app = text.match(/Applications?:\s*([^\n]+?)(?:Fit|Replace|$)/i);
  if (app) out["Applications"] = app[1].trim().slice(0, 80);
  out["Warranty"] = "2 years";
  return out;
}

// deterministic "pseudo-random" so output is stable across runs
function hash(s) {
  return parseInt(createHash("sha1").update(s).digest("hex").slice(0, 8), 16);
}

function ratingFor(sku) {
  const r = 42 + (hash(sku) % 18); // 42..59 → 4.2..5.9, cap at 4.9
  return Math.min(4.9, r / 10);
}
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

// ---- main ------------------------------------------------------------------

const raw = JSON.parse(await readFile(SRC, "utf8"));
console.log(`Source records: ${raw.length}`);

const seen = new Set();
const out = [];
let skipped = 0;

for (const r of raw) {
  const sku = String(r.sku ?? "").trim();
  if (!sku || seen.has(sku)) { skipped++; continue; }
  const cents = parsePriceCents(r.price);
  if (!cents) { skipped++; continue; }
  const name = cleanName(r.productName ?? r.partNumber);
  if (!name || name.length < 5) { skipped++; continue; }
  const brand = inferBrand(name);
  const category = inferCategory(name);
  const rating = ratingFor(sku);
  const image = Array.isArray(r.images) ? r.images.find((u) => typeof u === "string" && u.startsWith("http")) : null;

  seen.add(sku);
  out.push({
    sku,
    slug: `${slugify(name)}-${sku.toLowerCase()}`,
    name,
    brand,
    category,
    priceCents: cents,
    rating,
    reviewCount: reviewsFor(sku),
    badge: badgeFor(sku, rating),
    shortDescription: shortDescription(r.product_details, name),
    description: String(r.product_details ?? name).slice(0, 1200),
    specs: specsFromDetails(r.product_details, r.replacement_part_numbers, r.model_numbers),
    inStock: true,
    stockQty: stockFor(sku),
    imageUrl: image ?? null,
    replacementPartNumbers: Array.isArray(r.replacement_part_numbers) ? r.replacement_part_numbers : [],
    source: "fridayparts",
  });
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out, null, 0));
console.log(`Imported: ${out.length}, skipped: ${skipped}`);
console.log(`Wrote ${OUT} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);

// category breakdown
const byCat = {}; for (const p of out) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
console.log("Category breakdown:", byCat);
const byBrand = {}; for (const p of out) byBrand[p.brand] = (byBrand[p.brand] ?? 0) + 1;
console.log("Brand breakdown:", byBrand);
