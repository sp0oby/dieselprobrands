import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db, orders, promoCodes, promoRedemptions } from "@/db";
import { eq, sql } from "drizzle-orm";
import { clearCart } from "@/lib/cart";
import { pushSalesOrder } from "@/lib/zoho/inventory-sync";
import { pushInvoice, pushPayment, pushCreditNote } from "@/lib/zoho/books-sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new NextResponse("missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return new NextResponse(`webhook signature failed: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const shipping = session.shipping_details?.address;
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: "paid",
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          shippingAddress: shipping
            ? {
                fullName: session.shipping_details?.name ?? session.customer_details?.name ?? "",
                line1: shipping.line1 ?? "",
                line2: shipping.line2 ?? undefined,
                city: shipping.city ?? "",
                state: shipping.state ?? "",
                zip: shipping.postal_code ?? "",
                country: shipping.country ?? "US",
              }
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Record promo redemption + increment uses_count
      const code = session.metadata?.promoCode;
      if (code && updatedOrder?.promoDiscountCents) {
        const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
        if (promo) {
          await db.insert(promoRedemptions).values({
            promoId: promo.id,
            orderId: updatedOrder.id,
            userId: updatedOrder.userId,
            discountCents: updatedOrder.promoDiscountCents,
          });
          await db
            .update(promoCodes)
            .set({ usesCount: sql`${promoCodes.usesCount} + 1` })
            .where(eq(promoCodes.id, promo.id));
        }
      }

      await clearCart().catch(() => {});

      // Push to Zoho. All no-op when Zoho not configured.
      if (updatedOrder?.id) {
        // Sequential: Sales Order → Invoice → Payment (each needs the previous).
        (async () => {
          await pushSalesOrder(updatedOrder.id);
          const inv = await pushInvoice(updatedOrder.id);
          if (inv.ok && inv.invoiceId) {
            await pushPayment(
              updatedOrder.id,
              updatedOrder.totalCents,
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            );
          }
        })().catch(() => {});
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (pi) {
      const [order] = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, pi)).limit(1);
      if (order) {
        const refundedAmt = charge.amount_refunded; // cents
        const isFull = refundedAmt >= order.totalCents;
        await db
          .update(orders)
          .set({
            refundedCents: refundedAmt,
            refundedAt: new Date(),
            status: isFull ? "refunded" : order.status,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
        pushCreditNote(order.id, refundedAmt, charge.refunds?.data?.[0]?.reason ?? "Customer refund").catch(() => {});
      }
    }
  }

  return NextResponse.json({ received: true });
}
