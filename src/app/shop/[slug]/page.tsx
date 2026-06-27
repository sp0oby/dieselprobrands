import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ProductCard } from "@/components/site/product-card";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { getProductDetail, listRelatedProducts } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { getCurrentTier } from "@/lib/pricing-context";
import { TIER_LABELS, TIER_RATES, VOLUME_TIERS, priceLine } from "@/lib/pricing";
import { ReviewsSection } from "@/components/site/reviews-section";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProductDetail(slug);
  if (!data) notFound();
  const { product, brand, category } = data;
  const related = await listRelatedProducts(product.slug, product.categorySlug);

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-ink">{category?.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="card-surface relative aspect-square overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized priority />
          ) : (
            <div className="grid h-full w-full place-items-center text-6xl text-ink-dim">⚙️</div>
          )}
          {product.badge && <div className="absolute left-4 top-4"><ProductBadge kind={product.badge} /></div>}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/brands/${brand?.slug}`} className="text-sm font-bold uppercase tracking-wider text-brand-400 hover:text-brand-600">
              {brand?.name}
            </Link>
            <span className="text-ink-dim">•</span>
            <span className="text-sm text-ink-muted">{category?.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-ink lg:text-4xl">{product.name}</h1>
          <p className="font-mono text-sm text-ink-dim">SKU: {product.sku}</p>
          {product.reviewCount > 0 ? (
            <StarRating value={Number(product.rating)} count={product.reviewCount} />
          ) : (
            <span className="text-xs text-ink-dim">No reviews yet — be the first to leave one below</span>
          )}

          <PriceBlock product={product} />

          <p className="text-ink-muted leading-relaxed">{product.shortDescription}</p>

          <div className="flex items-center gap-2 text-sm">
            {product.inStock ? (
              <><Check className="size-4 text-emerald-600" /><span className="text-emerald-600">In stock</span><span className="text-ink-muted">— {product.stockQty} units available</span></>
            ) : (
              <span className="text-amber-600">Out of stock</span>
            )}
          </div>

          <div className="mt-2"><AddToCartButton productId={product.id} /></div>

          <VolumeLadder retailCents={product.priceCents} />

          <ul className="mt-2 space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-400" /> {product.specs?.Warranty ?? "2-year"} warranty included</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-brand-400" /> Same-day ship on orders before 2pm EST</li>
            <li className="flex items-center gap-2"><RotateCcw className="size-4 text-brand-400" /> 60-day return window</li>
          </ul>
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-ink">Description</h2>
          <p className="text-ink-muted leading-relaxed">{product.description}</p>

          {product.specs?.Replaces && (
            <div>
              <h3 className="text-base font-bold text-ink">Cross-references</h3>
              <p className="mt-1 text-xs text-ink-muted">Click any part number to see all equivalents we carry.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.specs.Replaces.split(",").map((n) => n.trim()).filter(Boolean).map((n) => (
                  <Link
                    key={n}
                    href={`/search/oem/${encodeURIComponent(n)}`}
                    className="rounded-md border border-black/10 bg-bg-panel px-2.5 py-1 font-mono text-xs text-brand-400 hover:border-brand/40 hover:text-brand-600"
                  >
                    {n}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card-surface p-6">
          <h3 className="text-lg font-bold text-ink">Specifications</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {Object.entries(product.specs ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-black/[0.06] pb-2 last:border-0 last:pb-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ReviewsSection productId={product.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Related Parts</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

async function PriceBlock({ product }: { product: { id: string; priceCents: number; originalPriceCents: number | null } }) {
  const tier = await getCurrentTier();
  const tierRate = TIER_RATES[tier] ?? 0;
  const yourUnit = Math.max(0, product.priceCents - Math.round(product.priceCents * tierRate));
  const savings = product.priceCents - yourUnit;
  if (tier === "retail") {
    return (
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-extrabold text-ink">{formatPrice(product.priceCents)}</span>
        {product.originalPriceCents && (
          <span className="text-xl text-ink-dim line-through">{formatPrice(product.originalPriceCents)}</span>
        )}
      </div>
    );
  }
  return (
    <div className="mt-2 rounded-lg border border-brand/30 bg-brand/[0.04] p-4">
      <p className="text-xs uppercase tracking-wider text-brand-400 font-semibold">Your {TIER_LABELS[tier]} price</p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-4xl font-extrabold text-ink">{formatPrice(yourUnit)}</span>
        <span className="text-lg text-ink-dim line-through">{formatPrice(product.priceCents)}</span>
      </div>
      <p className="mt-1 text-sm text-emerald-700">Save {formatPrice(savings)} ({Math.round(tierRate * 100)}% off retail)</p>
    </div>
  );
}

function VolumeLadder({ retailCents }: { retailCents: number }) {
  return (
    <div className="mt-3 rounded-md border border-black/[0.06] bg-bg-panel p-4 text-xs text-ink-muted">
      <p className="font-semibold text-ink">Buy more, save more</p>
      <ul className="mt-2 space-y-1">
        {VOLUME_TIERS.slice().reverse().map((t) => (
          <li key={t.minQty} className="flex justify-between">
            <span>{t.label}</span>
            <span className="text-emerald-700">−{Math.round(t.rate * 100)}% per unit</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
