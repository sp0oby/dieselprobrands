"use server";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db, productReviews, orders, orderItems, profiles, type ReviewStatus } from "@/db";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function submitReview(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Review must be at least 10 characters with a 1–5 rating." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const authorName = profile?.fullName ?? (user.email!.split("@")[0]);

  // Check verified purchase
  const [purchase] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, user.id), eq(orderItems.productId, parsed.data.productId)))
    .limit(1);

  await db.insert(productReviews).values({
    productId: parsed.data.productId,
    userId: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    authorName,
    verifiedPurchase: Boolean(purchase),
    // Auto-publish verified purchases — moderate the rest.
    status: purchase ? "published" : "pending",
  });
  revalidatePath("/shop/[slug]", "page");
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function voteReviewHelpful(reviewId: string) {
  await db
    .update(productReviews)
    .set({ helpfulCount: sql`${productReviews.helpfulCount} + 1` })
    .where(eq(productReviews.id, reviewId));
  revalidatePath("/shop/[slug]", "page");
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

export async function setReviewStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as ReviewStatus;
  await db.update(productReviews).set({ status }).where(eq(productReviews.id, id));
  revalidatePath("/admin/reviews");
}
