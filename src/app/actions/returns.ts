"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, orders, orderItems, returnRequests, returnItems, type ReturnReason, type ReturnItemDecision } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { pushCreditNote } from "@/lib/zoho/books-sync";
import { checkReturnEligibility, restockingFeeFor, valueOfReturnedItems } from "@/lib/returns";

const Submission = z.object({
  orderId: z.string().uuid(),
  reason: z.enum(["defective", "wrong_part", "no_longer_needed", "damaged_in_shipping", "ordered_by_mistake", "other"]),
  note: z.string().optional(),
  items: z.array(z.object({ orderItemId: z.string().uuid(), quantity: z.coerce.number().int().min(1) })).min(1),
});

export type SubmitReturnResult = { ok: true; rmaId: string; rmaNumber: number } | { ok: false; error: string };

export async function submitReturnRequest(input: unknown): Promise<SubmitReturnResult> {
  const parsed = Submission.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please pick at least one item and a reason." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to request a return." };

  const [order] = await db.select().from(orders).where(eq(orders.id, parsed.data.orderId)).limit(1);
  if (!order || order.userId !== user.id) return { ok: false, error: "Order not found." };

  const elig = checkReturnEligibility(order);
  if (!elig.eligible) return { ok: false, error: elig.reason };

  // Validate quantities against original order items minus already-returned amounts.
  const requestedIds = parsed.data.items.map((i) => i.orderItemId);
  const lines = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, order.id), inArray(orderItems.id, requestedIds)));
  if (lines.length !== requestedIds.length) return { ok: false, error: "One or more items don't belong to this order." };

  // Sum already-returned quantities per item across non-rejected requests.
  const already = await db
    .select({
      orderItemId: returnItems.orderItemId,
      qty: sql<number>`coalesce(sum(${returnItems.quantity}), 0)`,
    })
    .from(returnItems)
    .innerJoin(returnRequests, eq(returnRequests.id, returnItems.requestId))
    .where(and(eq(returnRequests.orderId, order.id), sql`${returnRequests.status} <> 'rejected'`))
    .groupBy(returnItems.orderItemId);
  const alreadyMap = new Map(already.map((r) => [r.orderItemId, Number(r.qty)]));

  const valueInputs: { unitPriceCents: number; quantity: number }[] = [];
  for (const sel of parsed.data.items) {
    const line = lines.find((l) => l.id === sel.orderItemId)!;
    const max = line.quantity - (alreadyMap.get(line.id) ?? 0);
    if (sel.quantity > max) {
      return { ok: false, error: `Only ${max} of "${line.productName}" remain returnable.` };
    }
    valueInputs.push({ unitPriceCents: line.unitPriceCents, quantity: sel.quantity });
  }

  const subtotalCents = valueOfReturnedItems(valueInputs);
  const fee = restockingFeeFor(subtotalCents);
  const refundCents = Math.max(0, subtotalCents - fee.feeCents);

  const [created] = await db
    .insert(returnRequests)
    .values({
      orderId: order.id,
      userId: user.id,
      reason: parsed.data.reason as ReturnReason,
      customerNote: parsed.data.note ?? null,
      restockingFeeCents: fee.feeCents,
      refundAmountCents: refundCents,
    })
    .returning({ id: returnRequests.id, rmaNumber: returnRequests.rmaNumber });

  await db.insert(returnItems).values(
    parsed.data.items.map((it) => ({ requestId: created.id, orderItemId: it.orderItemId, quantity: it.quantity })),
  );

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/account");
  return { ok: true, rmaId: created.id, rmaNumber: created.rmaNumber };
}

// ---- admin actions ----------------------------------------------------------

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
  return user;
}

export async function approveReturnRequest(formData: FormData) {
  const reviewer = await assertAdmin();
  const id = String(formData.get("id"));
  const note = (String(formData.get("note") || "").trim() || null) as string | null;
  // Optional override of refund amount
  const refundOverride = formData.get("refundAmount") ? Math.round(Number(formData.get("refundAmount")) * 100) : null;

  const [req] = await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
  if (!req) throw new Error("not found");

  await db
    .update(returnRequests)
    .set({
      status: "approved",
      approvedAt: new Date(),
      reviewerId: reviewer.id,
      reviewerNote: note,
      refundAmountCents: refundOverride ?? req.refundAmountCents,
    })
    .where(eq(returnRequests.id, id));

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${id}`);
}

export async function rejectReturnRequest(formData: FormData) {
  const reviewer = await assertAdmin();
  const id = String(formData.get("id"));
  const note = (String(formData.get("note") || "").trim() || null) as string | null;
  await db
    .update(returnRequests)
    .set({ status: "rejected", reviewerId: reviewer.id, reviewerNote: note, approvedAt: new Date() })
    .where(eq(returnRequests.id, id));
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${id}`);
}

export async function markReturnReceived(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await db.update(returnRequests).set({ status: "received", receivedAt: new Date() }).where(eq(returnRequests.id, id));
  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${id}`);
}

export async function setItemDecision(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("itemId"));
  const decision = String(formData.get("decision")) as ReturnItemDecision;
  const note = String(formData.get("conditionNote") || "").trim() || null;
  await db.update(returnItems).set({ decision, conditionNote: note }).where(eq(returnItems.id, id));
  revalidatePath(`/admin/returns/${String(formData.get("requestId"))}`);
}

// Process refund: hits Stripe, which fires charge.refunded webhook,
// which already cascades into Zoho credit note + DB updates.
// Here we just kick off Stripe + mark our RMA row as refunded.
export async function processReturnRefund(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const [req] = await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
  if (!req) throw new Error("not found");

  const [order] = await db.select().from(orders).where(eq(orders.id, req.orderId)).limit(1);
  if (!order?.stripePaymentIntentId) throw new Error("no Stripe payment to refund");

  const refund = await getStripe().refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: req.refundAmountCents,
    reason: "requested_by_customer",
    metadata: { orderId: order.id, returnRequestId: id, rmaNumber: String(req.rmaNumber) },
  });

  // Optimistically update RMA — webhook will also fire credit note in Zoho Books.
  await db
    .update(returnRequests)
    .set({ status: "refunded", refundedAt: new Date(), stripeRefundId: refund.id })
    .where(eq(returnRequests.id, id));

  // Also push the credit note directly tagged with the RMA number for clarity.
  pushCreditNote(order.id, req.refundAmountCents, `RMA-${String(req.rmaNumber).padStart(6, "0")}`)
    .then((r) => {
      if (r.ok && r.creditNoteId) {
        return db.update(returnRequests).set({ zohoCreditNoteId: r.creditNoteId }).where(eq(returnRequests.id, id));
      }
    })
    .catch(() => {});

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${id}`);
  revalidatePath(`/orders/${order.id}`);
}
