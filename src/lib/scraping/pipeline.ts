import "server-only";
import { eq, inArray } from "drizzle-orm";
import {
  db, products, oemPartNumbers, scrapeRuns, brands, categories,
} from "@/db";
import { canonicalizePartNumber } from "@/lib/oem";
import { slugify } from "./shared";
import { fabHeavyScraper } from "./fabheavy";
import { fridayPartsScraper } from "./fridayparts";
import { tamerxScraper } from "./tamerx";
import type { Scraper, ScrapedProduct, ScraperResult } from "./types";

export const SCRAPERS: Record<string, Scraper> = {
  fabheavy: fabHeavyScraper,
  fridayparts: fridayPartsScraper,
  tamerx: tamerxScraper,
};

// ---- shared upsert -----------------------------------------------------------

async function ensureBrandExists(slug: string) {
  // brands are seeded from site.ts; this is a safety net for unknown brand slugs.
  try {
    await db.insert(brands).values({
      slug, name: slug.toUpperCase(), displayName: slug, category: "Engine Components",
      country: "Unknown", founded: 2000, description: "Auto-created brand.", productCount: 0, featured: false,
    }).onConflictDoNothing();
  } catch {}
}
async function ensureCategoryExists(slug: string) {
  try {
    await db.insert(categories).values({ slug, name: slug, icon: "⚙️", productCount: 0 }).onConflictDoNothing();
  } catch {}
}

async function upsertOne(sp: ScrapedProduct): Promise<"created" | "updated" | "skipped"> {
  await ensureBrandExists(sp.brand);
  await ensureCategoryExists(sp.category);

  const slug = `${slugify(sp.name)}-${sp.sku.toLowerCase()}`.slice(0, 100);

  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.sku, sp.sku)).limit(1);
  let productId: string;
  if (existing) {
    await db
      .update(products)
      .set({
        slug,
        name: sp.name,
        brandSlug: sp.brand,
        categorySlug: sp.category,
        priceCents: sp.priceCents,
        shortDescription: sp.shortDescription,
        description: sp.description,
        specs: sp.specs,
        inStock: sp.inStock,
        imageUrl: sp.imageUrl,
        source: sp.source,
      })
      .where(eq(products.id, existing.id));
    productId = existing.id;
  } else {
    const [row] = await db
      .insert(products)
      .values({
        sku: sp.sku,
        slug,
        name: sp.name,
        brandSlug: sp.brand,
        categorySlug: sp.category,
        priceCents: sp.priceCents,
        rating: "4.5",
        reviewCount: 0,
        shortDescription: sp.shortDescription,
        description: sp.description,
        specs: sp.specs,
        inStock: sp.inStock,
        stockQty: 0,
        imageUrl: sp.imageUrl,
        source: sp.source,
      })
      .returning({ id: products.id });
    productId = row.id;
  }

  // Re-index OEM numbers for this product (delete + insert).
  if (sp.replacementPartNumbers.length) {
    await db.delete(oemPartNumbers).where(eq(oemPartNumbers.productId, productId));
    const rows = sp.replacementPartNumbers
      .map((n) => ({ raw: String(n).trim(), canon: canonicalizePartNumber(String(n)) }))
      .filter((x) => x.raw && x.canon.length >= 4);
    const dedup = new Map(rows.map((r) => [r.canon, r.raw]));
    if (dedup.size) {
      await db
        .insert(oemPartNumbers)
        .values([...dedup.entries()].map(([canon, raw]) => ({
          productId,
          partNumber: canon,
          rawNumber: raw,
          source: sp.source,
        })))
        .onConflictDoNothing();
    }
  }

  return existing ? "updated" : "created";
}

// ---- runner ----------------------------------------------------------------

export async function runScraper(sourceId: string): Promise<ScraperResult> {
  const scraper = SCRAPERS[sourceId];
  if (!scraper) throw new Error(`unknown scraper: ${sourceId}`);

  const started = Date.now();
  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: sourceId, status: "running", fetched: 0, imported: 0, skipped: 0 })
    .returning({ id: scrapeRuns.id });

  let fetched = 0, imported = 0, skipped = 0;
  const errors: string[] = [];

  try {
    const scraped = await scraper.fetch();
    fetched = scraped.length;
    for (const p of scraped) {
      try {
        const res = await upsertOne(p);
        if (res === "skipped") skipped++;
        else imported++;
      } catch (e) {
        skipped++;
        errors.push(`${p.sku}: ${(e as Error).message}`);
      }
    }
    await db
      .update(scrapeRuns)
      .set({
        status: errors.length === fetched ? "error" : "ok",
        fetched, imported, skipped,
        durationMs: Date.now() - started,
        error: errors.slice(0, 3).join(" | ") || null,
        endedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id));
  } catch (e) {
    await db
      .update(scrapeRuns)
      .set({ status: "error", error: (e as Error).message, durationMs: Date.now() - started, endedAt: new Date() })
      .where(eq(scrapeRuns.id, run.id));
    throw e;
  }

  return { source: sourceId, fetched, imported, skipped, errors };
}
