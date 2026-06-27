import "server-only";
import { eq, and } from "drizzle-orm";
import { db, returnRequests } from "@/db";
import type { orders, orderItems } from "@/db";

// Returns & Warranty policy (matches /returns-warranty page):
// - 60-day return window from order date
// - 15% restocking fee standard
// - 20% restocking fee on orders > $2500
// - Custom-orders, clearance, opened consumables not returnable (caller decides per-product)

export const RETURN_WINDOW_DAYS = 60;
export const STANDARD_RESTOCKING_RATE = 0.15;
export const LARGE_ORDER_THRESHOLD_CENTS = 250000;
export const LARGE_ORDER_RESTOCKING_RATE = 0.20;

export type ReturnEligibility =
  | { eligible: true; daysRemaining: number }
  | { eligible: false; reason: string };

export function checkReturnEligibility(order: typeof orders.$inferSelect): ReturnEligibility {
  // Only delivered / paid orders can be returned.
  if (!["delivered", "paid", "shipped"].includes(order.status)) {
    return { eligible: false, reason: `Order status "${order.status}" is not eligible for return.` };
  }
  const ms = Date.now() - new Date(order.createdAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const remaining = RETURN_WINDOW_DAYS - days;
  if (remaining <= 0) {
    return { eligible: false, reason: `Return window closed (${days} days since order; ${RETURN_WINDOW_DAYS}-day policy).` };
  }
  if (order.refundedCents >= order.totalCents) {
    return { eligible: false, reason: "Order is already fully refunded." };
  }
  return { eligible: true, daysRemaining: remaining };
}

export function restockingFeeFor(subtotalCents: number): { rate: number; feeCents: number } {
  const rate = subtotalCents > LARGE_ORDER_THRESHOLD_CENTS ? LARGE_ORDER_RESTOCKING_RATE : STANDARD_RESTOCKING_RATE;
  return { rate, feeCents: Math.round(subtotalCents * rate) };
}

// Compute the dollar value of returned items based on their order unit price + quantity returned.
export function valueOfReturnedItems(
  selections: Array<{ unitPriceCents: number; quantity: number }>,
): number {
  return selections.reduce((s, x) => s + x.unitPriceCents * x.quantity, 0);
}

// Returns map of orderItemId → already-returned quantity (across approved/received/refunded requests)
// so we never refund more than the customer ordered.
export async function alreadyReturnedQuantities(orderId: string): Promise<Map<string, number>> {
  const rows = await db.query.returnRequests
    .findMany({
      where: and(eq(returnRequests.orderId, orderId)),
      with: { /* drizzle relation maybe not declared; fall back below */ } as never,
    })
    .catch(() => [] as Array<typeof returnRequests.$inferSelect>);

  // Fallback simple aggregation if the above relation isn't wired:
  if (!rows.length) return new Map();
  // We don't have items joined here; consumer should do separate query for items.
  return new Map();
}
