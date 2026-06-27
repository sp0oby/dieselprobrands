import "server-only";
import { cleanText, inferBrand, inferCategory, parsePriceCents, slugify } from "./shared";
import type { Scraper, ScrapedProduct } from "./types";

// Reads a FridayParts dataset previously scraped by Apify.
// Two ways to source it:
//  1. Live: set APIFY_TOKEN + APIFY_FRIDAYPARTS_DATASET_ID and we'll fetch the latest dataset
//  2. File:  fall back to the local seed dump under DPB_2/Scraping Data/ (good for dev)

type FridayPartsRaw = {
  sku?: string;
  productName?: string;
  partNumber?: string;
  price?: string;
  product_details?: string;
  replacement_part_numbers?: string[];
  images?: string[];
};

async function loadFromApify(): Promise<FridayPartsRaw[]> {
  const token = process.env.APIFY_TOKEN;
  const datasetId = process.env.APIFY_FRIDAYPARTS_DATASET_ID;
  if (!token || !datasetId) return [];
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Apify dataset HTTP ${res.status}`);
  return (await res.json()) as FridayPartsRaw[];
}

async function loadFromBundledSample(): Promise<FridayPartsRaw[]> {
  // Try the local sample dump committed in the project's source materials.
  // (Sourced from DPB_2/Scraping Data/Copy of fridayparts-sample-data.json — 535 records.)
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const samplePath = path.resolve(
      process.cwd(),
      "../DPB_2-20260627T173546Z-3-001/DPB_2/Scraping Data/Copy of fridayparts-sample-data.json",
    );
    const buf = await fs.readFile(samplePath, "utf8");
    return JSON.parse(buf) as FridayPartsRaw[];
  } catch {
    return [];
  }
}

function transform(raw: FridayPartsRaw[]): ScrapedProduct[] {
  const out: ScrapedProduct[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const sku = String(r.sku ?? "").trim();
    if (!sku || seen.has(sku)) continue;
    const cents = parsePriceCents(r.price);
    if (!cents) continue;
    const name = cleanText(r.productName ?? r.partNumber ?? "");
    if (name.length < 5) continue;
    const image = r.images?.find((u) => typeof u === "string" && u.startsWith("http")) ?? null;
    seen.add(sku);
    const desc = String(r.product_details ?? "");
    out.push({
      source: "fridayparts",
      sku,
      name,
      brand: inferBrand(name),
      category: inferCategory(name),
      priceCents: cents,
      shortDescription: desc.split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? name,
      description: desc.slice(0, 1500),
      specs: { Warranty: "2 years" },
      imageUrl: image,
      inStock: true,
      replacementPartNumbers: Array.isArray(r.replacement_part_numbers) ? r.replacement_part_numbers : [],
    });
  }
  return out;
}

export const fridayPartsScraper: Scraper = {
  source: "fridayparts",
  label: "FridayParts",
  description: "Apify-scraped dataset (live) or bundled sample dump (dev).",
  async fetch(): Promise<ScrapedProduct[]> {
    const live = await loadFromApify().catch(() => []);
    if (live.length) return transform(live);
    return transform(await loadFromBundledSample());
  },
};
