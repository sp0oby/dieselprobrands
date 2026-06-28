import "server-only";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { createClient } from "@/lib/supabase/server";

export type OrderAccess =
  | { ok: true; order: typeof orders.$inferSelect; viewer: "owner" | "admin" | "guest-token" }
  | { ok: false; reason: "not-found" | "needs-sign-in" | "forbidden" };

// Resolves whether the current request can view a specific order.
// Rules:
//   - Admins (ADMIN_EMAILS) can view any order.
//   - The signed-in owner can view their own order.
//   - A signed-out viewer can view a *guest* order (userId IS NULL) only if
//     `token` matches the order's stripeSessionId (the secret Stripe handed
//     the buyer at checkout — only they have it).
//   - All other cases: forbidden / needs-sign-in.
export async function resolveOrderAccess(orderId: string, token?: string | null): Promise<OrderAccess> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, reason: "not-found" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (user?.email && allow.includes(user.email.toLowerCase())) {
    return { ok: true, order, viewer: "admin" };
  }

  if (order.userId) {
    if (!user) return { ok: false, reason: "needs-sign-in" };
    if (user.id !== order.userId) return { ok: false, reason: "forbidden" };
    return { ok: true, order, viewer: "owner" };
  }

  // Guest order: gate on the Stripe session ID acting as a single-use access token.
  if (token && order.stripeSessionId && token === order.stripeSessionId) {
    return { ok: true, order, viewer: "guest-token" };
  }
  return { ok: false, reason: "forbidden" };
}
