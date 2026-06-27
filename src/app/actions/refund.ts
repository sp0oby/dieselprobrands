"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

export async function issueRefund(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const orderId = String(formData.get("orderId"));
  const amountRaw = String(formData.get("amount") || "");
  const reason = String(formData.get("reason") || "") || undefined;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "order not found" };
  if (!order.stripePaymentIntentId) return { ok: false, error: "no Stripe payment to refund" };

  // Empty amount → full remaining refund
  let cents: number | undefined;
  if (amountRaw.trim()) {
    cents = Math.round(parseFloat(amountRaw) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return { ok: false, error: "invalid amount" };
  }

  try {
    await getStripe().refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: cents,
      reason: (reason as "requested_by_customer" | "duplicate" | "fraudulent" | undefined) ?? "requested_by_customer",
      metadata: { orderId: order.id, dpb_reason: reason ?? "" },
    });
    // The actual db update + Zoho credit note happens on the charge.refunded webhook.
    revalidatePath(`/admin/orders`);
    revalidatePath(`/orders/${order.id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
