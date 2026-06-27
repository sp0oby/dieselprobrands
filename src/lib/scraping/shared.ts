import { createHash } from "crypto";

const BRAND_KEYWORDS: Array<[string, string]> = [
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

const CATEGORY_KEYWORDS: Array<[string, string]> = [
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

export function inferBrand(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, slug] of BRAND_KEYWORDS) if (lower.includes(kw)) return slug;
  return "bosch";
}
export function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, slug] of CATEGORY_KEYWORDS) if (lower.includes(kw)) return slug;
  return "engine-parts";
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function cleanText(s: string): string {
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

export function parsePriceCents(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  if (typeof s === "number") return Number.isFinite(s) && s > 0 ? Math.round(s * 100) : null;
  const m = String(s).match(/[\d,]+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function hash(s: string): number {
  return parseInt(createHash("sha1").update(s).digest("hex").slice(0, 8), 16);
}
