import { NextResponse } from "next/server";
import { getPricedCart } from "@/lib/cart";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { db, orders, orderItems } from "@/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const priced = await getPricedCart();
  if (priced.lines.length === 0) return NextResponse.redirect(new URL("/cart", req.url));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allocate promo discount proportionally across lines so Stripe sees per-line your-price.
  // We use one consolidated discount line for simplicity below.
  const [order] = await db
    .insert(orders)
    .values({
      userId: user?.id ?? null,
      email: user?.email ?? "guest@dieselprobrands.com",
      status: "pending",
      retailSubtotalCents: priced.retailSubtotalCents,
      tierDiscountCents: priced.tierDiscountCents,
      volumeDiscountCents: priced.volumeDiscountCents,
      promoDiscountCents: priced.promoDiscountCents,
      promoCode: priced.promoCode,
      subtotalCents: priced.subtotalAfterDiscountsCents - priced.promoDiscountCents,
      shippingCents: priced.shippingCents,
      shippingMethodSlug: priced.shippingMethod?.slug ?? null,
      taxCents: priced.taxCents,
      totalCents: priced.totalCents,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    priced.lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      productName: priced.lineMeta[l.productId]?.name ?? "Item",
      productSku: priced.lineMeta[l.productId]?.sku ?? "",
      unitPriceCents: l.yourUnitCents,
      quantity: l.quantity,
    })),
  );

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const stripe = getStripe();
  const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] = priced.lines.map((l) => {
    const meta = priced.lineMeta[l.productId]!;
    return {
      quantity: l.quantity,
      price_data: {
        currency: "usd",
        unit_amount: l.yourUnitCents,
        product_data: {
          name: meta.name,
          description: meta.sku,
          ...(meta.imageUrl ? { images: [meta.imageUrl] } : {}),
        },
      },
    };
  });

  if (priced.shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: priced.shippingCents, product_data: { name: priced.shippingMethod?.name ?? "Shipping" } },
    });
  }
  if (priced.taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: priced.taxCents, product_data: { name: "Tax (estimated)" } },
    });
  }

  // Promo discount → one-shot Stripe coupon (Stripe doesn't accept negative line items).
  let discounts: import("stripe").Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (priced.promoDiscountCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: priced.promoDiscountCents,
      currency: "usd",
      duration: "once",
      name: priced.promoCode ?? "Promo discount",
      max_redemptions: 1,
    });
    discounts = [{ coupon: coupon.id }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    discounts,
    customer_email: user?.email,
    metadata: { orderId: order.id, promoCode: priced.promoCode ?? "" },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
  });

  await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));

  return NextResponse.redirect(session.url!, { status: 303 });
}
