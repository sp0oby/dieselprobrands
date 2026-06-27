import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { CATEGORIES, BRANDS } from "../lib/site";
import data from "../data/products.json" with { type: "json" };
import type { SeedProduct } from "../lib/products";
const SEED_PRODUCTS = data as SeedProduct[];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("Seeding categories…");
  await db.insert(schema.categories).values(
    CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, productCount: c.count })),
  ).onConflictDoNothing();

  console.log("Seeding brands…");
  await db.insert(schema.brands).values(
    BRANDS.map((b) => ({
      slug: b.slug,
      name: b.name,
      displayName: b.displayName,
      category: b.category,
      country: b.country,
      founded: b.founded,
      description: b.description,
      productCount: b.count,
      featured: b.featured,
    })),
  ).onConflictDoNothing();

  console.log(`Seeding ${SEED_PRODUCTS.length} products (chunked)…`);
  const productRows = SEED_PRODUCTS.map((p) => ({
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brandSlug: p.brand,
    categorySlug: p.category,
    priceCents: p.priceCents,
    originalPriceCents: p.originalPriceCents ?? null,
    rating: p.rating.toFixed(1),
    reviewCount: p.reviewCount,
    badge: p.badge ?? null,
    shortDescription: p.shortDescription,
    description: p.description,
    specs: p.specs,
    inStock: p.inStock,
    stockQty: p.stockQty,
    imageUrl: p.imageUrl,
    source: p.source ?? null,
  }));
  for (let i = 0; i < productRows.length; i += 500) {
    const chunk = productRows.slice(i, i + 500);
    await db.insert(schema.products).values(chunk).onConflictDoNothing();
    if ((i / 500) % 5 === 0) console.log(`  ${Math.min(i + 500, productRows.length)} / ${productRows.length}`);
  }

  console.log("Seeding shipping methods…");
  await db.insert(schema.shippingMethods).values([
    { slug: "ground", name: "Standard Ground", description: "Best value for non-urgent orders.", baseCents: 1499, perItemCents: 0, freeShippingMinCents: 50000, etaDays: "3-5 business days", sortOrder: 1, active: true },
    { slug: "two-day", name: "2-Day Expedited", description: "Faster transit for time-sensitive parts.", baseCents: 2999, perItemCents: 200, freeShippingMinCents: null, etaDays: "2 business days", sortOrder: 2, active: true },
    { slug: "overnight", name: "Overnight", description: "Next-business-day delivery.", baseCents: 4999, perItemCents: 500, freeShippingMinCents: null, etaDays: "Next business day", sortOrder: 3, active: true },
    { slug: "freight", name: "LTL Freight", description: "Required for heavy assemblies (engine blocks, full crates).", baseCents: 19900, perItemCents: 0, freeShippingMinCents: null, etaDays: "5-10 business days", sortOrder: 4, active: true },
  ]).onConflictDoNothing();

  console.log("Seeding OEM cross-reference numbers…");
  // Need product ids; query back what we just inserted.
  const insertedRows = await db.select({ id: schema.products.id, sku: schema.products.sku }).from(schema.products);
  const idBySku = new Map(insertedRows.map((r) => [r.sku, r.id]));
  type SeededProduct = { sku: string; replacementPartNumbers?: string[]; source?: string };
  const { canonicalizePartNumber } = await import("../lib/oem");
  const oemRows: Array<{ productId: string; partNumber: string; rawNumber: string; source: string | null }> = [];
  for (const p of SEED_PRODUCTS as SeededProduct[]) {
    const pid = idBySku.get(p.sku);
    if (!pid || !Array.isArray(p.replacementPartNumbers)) continue;
    const seenForProduct = new Set<string>();
    for (const raw of p.replacementPartNumbers) {
      const canon = canonicalizePartNumber(raw);
      if (canon.length < 4 || seenForProduct.has(canon)) continue;
      seenForProduct.add(canon);
      oemRows.push({ productId: pid, partNumber: canon, rawNumber: raw, source: p.source ?? null });
    }
  }
  if (oemRows.length) {
    // chunk to avoid hitting Postgres parameter limits
    for (let i = 0; i < oemRows.length; i += 1000) {
      await db.insert(schema.oemPartNumbers).values(oemRows.slice(i, i + 1000)).onConflictDoNothing();
    }
    console.log(`  inserted ${oemRows.length} OEM numbers`);
  }

  console.log("Done.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
