"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, wishlistItems } from "@/db";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WishlistToggleResult =
  | { ok: true; wished: boolean }
  | { ok: false; needsAuth: true }
  | { ok: false; error: string };

export async function toggleWishlistAction(productId: string): Promise<WishlistToggleResult> {
  if (!UUID_RE.test(productId)) return { ok: false, error: "Invalid product." };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, needsAuth: true };

    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)))
      .limit(1);

    if (existing) {
      await db
        .delete(wishlistItems)
        .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)));
      revalidatePath("/account/wishlist");
      revalidatePath("/account");
      return { ok: true, wished: false };
    }

    await db.insert(wishlistItems).values({ userId: user.id, productId }).onConflictDoNothing();
    revalidatePath("/account/wishlist");
    revalidatePath("/account");
    return { ok: true, wished: true };
  } catch (e) {
    console.error("toggleWishlistAction failed:", e);
    return { ok: false, error: "Couldn't update wishlist." };
  }
}

export async function removeWishlistItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const productId = String(formData.get("productId"));
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId)));
  revalidatePath("/account/wishlist");
  revalidatePath("/account");
}
