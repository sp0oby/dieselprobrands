import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, products, brands, categories, oemPartNumbers, isDbConfigured } from "@/db";
import type { ProductCardProduct } from "@/components/site/product-card";
import { CATALOG } from "./catalog";
import { BRANDS, CATEGORIES } from "./site";
import { canonicalizePartNumber } from "./oem";

const SEED_PRODUCTS = CATALOG;

function seedAsCards(): ProductCardProduct[] {
  return SEED_PRODUCTS.map((p, i) => ({
    id: `seed-${i}`,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brandName: BRANDS.find((b) => b.slug === p.brand)?.displayName ?? p.brand,
    categoryName: CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category,
    priceCents: p.priceCents,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge,
    imageUrl: p.imageUrl ?? null,
  }));
}

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brandSlug: string;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  priceCents: number;
  rating: string;
  reviewCount: number;
  badge: string | null;
  imageUrl: string | null;
};

function toCard(r: ProductRow): ProductCardProduct {
  return {
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: r.name,
    brandName: r.brandName,
    categoryName: r.categoryName,
    priceCents: r.priceCents,
    rating: Number(r.rating),
    reviewCount: r.reviewCount,
    badge: r.badge,
    imageUrl: r.imageUrl,
  };
}

const baseQuery = () =>
  db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      name: products.name,
      brandSlug: products.brandSlug,
      brandName: brands.name,
      categorySlug: products.categorySlug,
      categoryName: categories.name,
      priceCents: products.priceCents,
      rating: products.rating,
      reviewCount: products.reviewCount,
      badge: products.badge,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .innerJoin(brands, eq(brands.slug, products.brandSlug))
    .innerJoin(categories, eq(categories.slug, products.categorySlug));

export async function listAllProducts() {
  if (!isDbConfigured()) return seedAsCards();
  try {
    const rows = await baseQuery().orderBy(desc(products.reviewCount));
    return rows.map(toCard);
  } catch { return seedAsCards(); }
}

export async function listHotDeals(limit = 8) {
  if (!isDbConfigured()) return seedAsCards().slice(0, limit);
  try {
    const rows = await baseQuery().orderBy(desc(products.reviewCount)).limit(limit);
    return rows.map(toCard);
  } catch { return seedAsCards().slice(0, limit); }
}

export type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "best-rated";

export async function searchProducts(params: {
  category?: string;
  brand?: string;
  engine?: string;
  q?: string;
  priceRange?: "under-200" | "200-500" | "500-1000" | "1000-plus" | "all";
  inStockOnly?: boolean;
  sort?: Sort;
}) {
  const conditions = [];
  if (params.category && params.category !== "all") conditions.push(eq(products.categorySlug, params.category));
  if (params.brand) conditions.push(eq(products.brandSlug, params.brand));
  // Engine model lives in the `specs` JSONB. Match its serialized text so we
  // catch both the curated `Engines` key and any engine mentions in description-like fields.
  if (params.engine) conditions.push(sql`${products.specs}::text ILIKE ${"%" + params.engine + "%"}`);
  if (params.q) conditions.push(or(ilike(products.name, `%${params.q}%`), ilike(products.sku, `%${params.q}%`))!);
  if (params.inStockOnly) conditions.push(eq(products.inStock, true));
  if (params.priceRange && params.priceRange !== "all") {
    const ranges: Record<string, [number, number]> = {
      "under-200": [0, 20000],
      "200-500": [20000, 50000],
      "500-1000": [50000, 100000],
      "1000-plus": [100000, 99999999],
    };
    const [lo, hi] = ranges[params.priceRange];
    conditions.push(sql`${products.priceCents} >= ${lo} AND ${products.priceCents} < ${hi}`);
  }

  if (!isDbConfigured()) {
    let cards = seedAsCards();
    if (params.category && params.category !== "all") cards = cards.filter((c) => SEED_PRODUCTS.find((p) => p.slug === c.slug)?.category === params.category);
    if (params.brand) cards = cards.filter((c) => SEED_PRODUCTS.find((p) => p.slug === c.slug)?.brand === params.brand);
    if (params.engine) {
      const eng = params.engine.toLowerCase();
      cards = cards.filter((c) => JSON.stringify(SEED_PRODUCTS.find((p) => p.slug === c.slug)?.specs ?? {}).toLowerCase().includes(eng));
    }
    if (params.q) cards = cards.filter((c) => c.name.toLowerCase().includes(params.q!.toLowerCase()) || c.sku.toLowerCase().includes(params.q!.toLowerCase()));
    return cards;
  }
  try {
    let q = baseQuery();
    if (conditions.length) q = q.where(and(...conditions)) as typeof q;

    switch (params.sort) {
      case "price-asc": q = q.orderBy(asc(products.priceCents)) as typeof q; break;
      case "price-desc": q = q.orderBy(desc(products.priceCents)) as typeof q; break;
      case "name-asc": q = q.orderBy(asc(products.name)) as typeof q; break;
      case "best-rated": q = q.orderBy(desc(products.rating), desc(products.reviewCount)) as typeof q; break;
      default: q = q.orderBy(desc(products.reviewCount)) as typeof q;
    }
    const rows = await q;
    return rows.map(toCard);
  } catch { return seedAsCards(); }
}

export async function getProductDetail(slug: string) {
  if (isDbConfigured()) {
    try {
      const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      if (row) {
        const [b] = await db.select().from(brands).where(eq(brands.slug, row.brandSlug)).limit(1);
        const [c] = await db.select().from(categories).where(eq(categories.slug, row.categorySlug)).limit(1);
        return { product: row, brand: b, category: c };
      }
    } catch { /* fall through */ }
  }
  const p = SEED_PRODUCTS.find((x) => x.slug === slug);
  if (!p) return null;
  const b = BRANDS.find((x) => x.slug === p.brand);
  const c = CATEGORIES.find((x) => x.slug === p.category);
  return {
    product: {
      id: `seed-${p.sku}`,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brandSlug: p.brand,
      categorySlug: p.category,
      priceCents: p.priceCents,
      originalPriceCents: p.originalPriceCents ?? null,
      rating: p.rating.toFixed(1),
      reviewCount: p.reviewCount,
      badge: p.badge,
      shortDescription: p.shortDescription,
      description: p.description,
      specs: p.specs,
      inStock: p.inStock,
      stockQty: p.stockQty,
      imageUrl: p.imageUrl ?? null,
      createdAt: new Date(),
    } as unknown as typeof products.$inferSelect,
    brand: b ? { ...b, productCount: b.count } as unknown as typeof brands.$inferSelect : undefined,
    category: c ? { ...c, productCount: c.count } as unknown as typeof categories.$inferSelect : undefined,
  };
}

// OEM cross-reference search: find every product whose replacement_part_numbers
// covers the given competitor/OEM part number.
// Pull real per-category product counts from the DB so homepage + shop
// always show accurate numbers (the static CATEGORIES list is just for
// slug/name/icon ordering — counts there are seed placeholders).
export async function listCategoriesWithCounts(): Promise<Array<typeof CATEGORIES[number] & { count: number }>> {
  if (!isDbConfigured()) return [...CATEGORIES];
  try {
    const rows = await db
      .select({ slug: categories.slug, count: sql<number>`coalesce(${categories.productCount}, 0)` })
      .from(categories);
    const countBySlug = new Map(rows.map((r) => [r.slug, Number(r.count)]));
    return CATEGORIES.map((c) => ({ ...c, count: countBySlug.get(c.slug) ?? 0 }));
  } catch {
    return [...CATEGORIES];
  }
}

export async function searchByOemNumber(input: string) {
  const canon = canonicalizePartNumber(input);
  if (canon.length < 4) return [] as ProductCardProduct[];

  if (isDbConfigured()) {
    try {
      const rows = await baseQuery()
        .innerJoin(oemPartNumbers, eq(oemPartNumbers.productId, products.id))
        .where(eq(oemPartNumbers.partNumber, canon))
        .limit(20);
      return rows.map(toCard);
    } catch { /* fall through */ }
  }
  // seed fallback: scan CATALOG for matching replacementPartNumbers
  const matches = SEED_PRODUCTS.filter((p) =>
    (p.replacementPartNumbers ?? []).some((n) => canonicalizePartNumber(n) === canon),
  );
  return matches.slice(0, 20).map((p, i) => ({
    id: `seed-${i}`,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brandName: BRANDS.find((b) => b.slug === p.brand)?.displayName ?? p.brand,
    categoryName: CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category,
    priceCents: p.priceCents,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge,
    imageUrl: p.imageUrl ?? null,
  }));
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  if (!isDbConfigured()) {
    return slugs
      .map((s) => SEED_PRODUCTS.find((p) => p.slug === s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }
  try {
    const rows = await db.select().from(products).where(inArray(products.slug, slugs));
    // Preserve caller's order
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return slugs.map((s) => bySlug.get(s)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  } catch {
    return slugs
      .map((s) => SEED_PRODUCTS.find((p) => p.slug === s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }
}

export async function listRelatedProducts(slug: string, categorySlug: string, limit = 4) {
  if (!isDbConfigured()) return seedAsCards().filter((c) => c.slug !== slug).slice(0, limit);
  try {
    const rows = await baseQuery()
      .where(and(eq(products.categorySlug, categorySlug), sql`${products.slug} <> ${slug}`))
      .limit(limit);
    return rows.map(toCard);
  } catch {
    return seedAsCards().filter((c) => c.slug !== slug).slice(0, limit);
  }
}
