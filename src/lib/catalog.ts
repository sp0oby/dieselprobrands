import "server-only";
import data from "@/data/products.json";
import type { SeedProduct } from "./products";

// 535 products imported from FridayParts.
// Run `node scripts/import-fridayparts.mjs` to regenerate from the source JSON.
export const CATALOG = data as SeedProduct[];

export function findProduct(slug: string): SeedProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function listProductsByCategory(categorySlug?: string): SeedProduct[] {
  if (!categorySlug || categorySlug === "all") return CATALOG;
  return CATALOG.filter((p) => p.category === categorySlug);
}

export function listProductsByBrand(brandSlug: string): SeedProduct[] {
  return CATALOG.filter((p) => p.brand === brandSlug);
}
