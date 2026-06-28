import { NextResponse } from "next/server";
import { and, eq, gt, lt, sql, isNull, isNotNull } from "drizzle-orm";
import { db, carts, cartItems, products, profiles, cartAbandonmentNotifications } from "@/db";
import { sendEmail, abandonedCartEmail } from "@/lib/email";
import { logSync } from "@/lib/zoho/client";
import { requireCronAuth } from "@/lib/cron-auth";

// Stages: 4 hours, 24 hours, 7 days after last cart activity.
const STAGES = [
  { id: "4h", minHours: 4, maxHours: 24 },
  { id: "24h", minHours: 24, maxHours: 7 * 24 },
  { id: "7d", minHours: 7 * 24, maxHours: 30 * 24 },
];

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  const started = Date.now();
  const now = new Date();
  let totalSent = 0;
  let totalSkipped = 0;

  for (const stage of STAGES) {
    try {
      const minTs = new Date(now.getTime() - stage.maxHours * 3600 * 1000);
      const maxTs = new Date(now.getTime() - stage.minHours * 3600 * 1000);

      // Find candidate carts: has items, no notification at this stage yet, updated in window.
      const candidates = await db
        .select({
          cartId: carts.id,
          userId: carts.userId,
          updatedAt: carts.updatedAt,
          email: sql<string | null>`coalesce(${profiles.email}, ${carts.email})`,
          fullName: profiles.fullName,
        })
        .from(carts)
        .leftJoin(profiles, eq(profiles.id, carts.userId))
        .where(
          and(
            gt(carts.updatedAt, minTs),
            lt(carts.updatedAt, maxTs),
            isNotNull(sql`coalesce(${profiles.email}, ${carts.email})`),
          ),
        );

      for (const c of candidates) {
        if (!c.email) { totalSkipped++; continue; }

        // Skip if already notified at this stage
        const [existing] = await db
          .select()
          .from(cartAbandonmentNotifications)
          .where(
            and(
              eq(cartAbandonmentNotifications.cartId, c.cartId),
              eq(cartAbandonmentNotifications.stage, stage.id),
            ),
          )
          .limit(1);
        if (existing) { totalSkipped++; continue; }

        // Check cart still has items
        const lines = await db
          .select({
            quantity: cartItems.quantity,
            unitPriceCents: products.priceCents,
          })
          .from(cartItems)
          .innerJoin(products, eq(products.id, cartItems.productId))
          .where(eq(cartItems.cartId, c.cartId));
        if (lines.length === 0) { totalSkipped++; continue; }

        const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
        const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
        const subtotal = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", useGrouping: false }).format(subtotalCents / 100);

        const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dieselprobrands.com"}/cart`;
        const tpl = abandonedCartEmail({ fullName: c.fullName ?? undefined, cartUrl, itemCount, subtotal });
        const result = await sendEmail({ to: c.email, ...tpl });

        if (result.ok) {
          await db.insert(cartAbandonmentNotifications).values({ cartId: c.cartId, stage: stage.id });
          totalSent++;
        } else {
          totalSkipped++;
        }
      }
    } catch (e) {
      await logSync({ service: "supabase" as never, operation: `abandoned_cart_${stage.id}`, status: "error", error: (e as Error).message });
    }
  }

  await logSync({
    service: "supabase" as never,
    operation: "abandoned_cart",
    status: "ok",
    recordsAffected: totalSent,
    durationMs: Date.now() - started,
  });

  return NextResponse.json({ sent: totalSent, skipped: totalSkipped });
}
