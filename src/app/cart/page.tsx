import Link from "next/link";
import { ShoppingBag, ArrowRight, BadgePercent, TrendingDown, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPricedCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { TIER_LABELS, nextVolumeTier } from "@/lib/pricing";
import { CartItemRow } from "@/components/site/cart-item-row";
import { PromoForm } from "@/components/site/promo-form";
import { ShippingPicker } from "@/components/site/shipping-picker";
import { listShippingMethods, calculateShipping } from "@/lib/shipping";

export default async function CartPage() {
  const priced = await getPricedCart();
  const allMethods = await listShippingMethods();
  const subtotalForShipping = priced.subtotalAfterDiscountsCents;
  const itemCount = priced.lines.reduce((s, l) => s + l.quantity, 0);
  const shippingRates: Record<string, { cents: number; isFree: boolean }> = Object.fromEntries(
    allMethods.map((m) => {
      const cents = calculateShipping(m, subtotalForShipping, itemCount);
      return [m.slug, { cents, isFree: cents === 0 && m.freeShippingMinCents != null }];
    }),
  );

  if (priced.lines.length === 0) {
    return (
      <div className="container-x py-24">
        <div className="card-surface mx-auto max-w-md p-10 text-center">
          <ShoppingBag className="mx-auto size-10 text-ink-dim" />
          <h1 className="mt-4 text-2xl font-bold text-ink">Your cart is empty</h1>
          <p className="mt-2 text-ink-muted">Browse the catalog to add some diesel parts.</p>
          <Button asChild className="mt-6"><Link href="/shop">Continue Shopping <ArrowRight /></Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl font-extrabold text-ink">Shopping Cart</h1>
      <p className="mt-2 text-ink-muted">
        <span className="text-ink font-semibold">{priced.lines.length}</span> items in your cart
        {priced.tier !== "retail" && (
          <> · pricing shown as <Badge variant="brand">{TIER_LABELS[priced.tier]}</Badge></>
        )}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="card-surface divide-y divide-black/[0.06]">
          {priced.lines.map((l) => {
            const meta = priced.lineMeta[l.productId];
            if (!meta) return null;
            const nextTier = nextVolumeTier(l.quantity);
            return (
              <div key={l.productId}>
                <CartItemRow
                  line={{
                    productId: l.productId,
                    slug: meta.slug,
                    name: meta.name,
                    sku: meta.sku,
                    unitPriceCents: l.yourUnitCents,
                    retailUnitCents: l.retailUnitCents,
                    quantity: l.quantity,
                    imageUrl: meta.imageUrl,
                    brandSlug: meta.brandSlug,
                  }}
                />
                {(l.volumeLabel || nextTier) && (
                  <div className="px-4 pb-4 sm:px-6">
                    <div className="rounded-md border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
                      {l.volumeLabel && <span><TrendingDown className="mr-1 inline size-3" /> Volume discount applied ({l.volumeLabel})</span>}
                      {nextTier && (
                        <span className="ml-2 text-emerald-700/70">
                          Add {nextTier.minQty - l.quantity} more for {Math.round(nextTier.rate * 100)}% off.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <aside className="card-surface p-6 h-fit lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-ink">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row k="Subtotal (retail)" v={formatPrice(priced.retailSubtotalCents)} />
            {priced.tierDiscountCents > 0 && (
              <Row k={`Tier discount (${TIER_LABELS[priced.tier]})`} v={`− ${formatPrice(priced.tierDiscountCents)}`} accent="emerald" />
            )}
            {priced.volumeDiscountCents > 0 && (
              <Row k="Volume discount" v={`− ${formatPrice(priced.volumeDiscountCents)}`} accent="emerald" />
            )}
            <Row k="Subtotal" v={formatPrice(priced.subtotalAfterDiscountsCents)} />

            <PromoForm currentCode={priced.promoCode} error={priced.promoError} />

            {priced.promoDiscountCents > 0 && (
              <Row k={`Promo (${priced.promoCode})`} v={`− ${formatPrice(priced.promoDiscountCents)}`} accent="emerald" />
            )}
          </dl>

          <div className="mt-5 space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Truck className="size-4 text-brand-400" /> Shipping method</p>
            <ShippingPicker
              methods={allMethods.map((m) => ({ slug: m.slug, name: m.name, description: m.description, etaDays: m.etaDays }))}
              selected={priced.shippingMethod?.slug ?? null}
              rates={shippingRates}
            />
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <Row k="Tax (estimated)" v={formatPrice(priced.taxCents)} />
            <div className="hairline pt-3">
              <Row k="Total" v={formatPrice(priced.totalCents)} large />
            </div>
          </dl>
          {priced.tier !== "retail" && (
            <p className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-700">
              <BadgePercent className="size-3.5" /> You saved {formatPrice(priced.retailSubtotalCents - priced.subtotalAfterDiscountsCents + priced.promoDiscountCents)} vs. retail.
            </p>
          )}
          <form action="/api/checkout" method="POST" className="mt-6 space-y-3">
            <Button type="submit" size="lg" className="w-full">Proceed to Checkout <ArrowRight /></Button>
            <Button asChild variant="outline" className="w-full"><Link href="/shop">Continue Shopping</Link></Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, large, accent }: { k: string; v: string; large?: boolean; accent?: "emerald" }) {
  const valueClass = accent === "emerald" ? "text-emerald-700" : large ? "text-base font-bold text-ink" : "text-ink";
  return (
    <div className="flex justify-between">
      <dt className={large ? "text-base font-semibold text-ink" : "text-ink-muted"}>{k}</dt>
      <dd className={valueClass}>{v}</dd>
    </div>
  );
}
