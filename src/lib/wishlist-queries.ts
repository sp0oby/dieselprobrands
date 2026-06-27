import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db, wishlistItems, products, brands, categories } from "@/db";
import { createClient } from "./supabase/server";
import type { ProductCardProduct } from "@/components/site/product-card";

export async function getCurrentUserWishlistIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();
    const rows = await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id));
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

export async function listWishlistProducts(userId: string): Promise<ProductCardProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      name: products.name,
      brandName: brands.displayName,
      categoryName: categories.name,
      priceCents: products.priceCents,
      rating: products.rating,
      reviewCount: products.reviewCount,
      badge: products.badge,
      imageUrl: products.imageUrl,
      addedAt: wishlistItems.addedAt,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .innerJoin(brands, eq(brands.slug, products.brandSlug))
    .innerJoin(categories, eq(categories.slug, products.categorySlug))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.addedAt));
  return rows.map((r) => ({
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
  }));
}
