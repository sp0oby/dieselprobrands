"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, ShoppingCart, Check, Tag } from "lucide-react";
import { ProductBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { formatPrice, cn } from "@/lib/utils";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { CompareToggle } from "@/components/site/compare-toggle";

export type ProductCardProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brandName: string;
  categoryName: string;
  priceCents: number;
  rating: number;
  reviewCount: number;
  badge: string | null;
  imageUrl: string | null;
};

export function ProductCard({ p, initialWished = false }: { p: ProductCardProduct; initialWished?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(initialWished);
  const [wishPending, startWish] = useTransition();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-bg-card transition-colors hover:border-black/[0.12]">
      <Link href={`/shop/${p.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-bg-elev">
          {p.imageUrl && !imgFailed ? (
            <Image
              src={p.imageUrl}
              alt={p.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-bg-elev text-ink-dim">
              <span className="text-4xl">⚙️</span>
              <span className="px-3 text-center font-mono text-[10px] uppercase tracking-wider">{p.sku}</span>
            </div>
          )}
          {p.badge && <div className="absolute left-3 top-3"><ProductBadge kind={p.badge} /></div>}
        </div>
      </Link>

      {/* wishlist — dark circle with white outline heart, matches Figma */}
      <button
        type="button"
        disabled={wishPending}
        onClick={(e) => {
          e.preventDefault();
          const next = !wished;
          setWished(next); // optimistic
          startWish(async () => {
            const res = await toggleWishlistAction(p.id);
            if ("needsAuth" in res && res.needsAuth) {
              setWished(false);
              router.push(`/sign-in?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/shop")}`);
              return;
            }
            if (!res.ok) setWished(!next);
          });
        }}
        aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-bg-panel/90 text-white backdrop-blur-sm transition-colors hover:bg-bg-panel disabled:opacity-60",
          wished && "bg-brand hover:bg-brand-700",
        )}
      >
        <Heart className={cn("size-4", wished && "fill-current")} strokeWidth={1.75} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] uppercase tracking-wider font-semibold flex items-center justify-between">
          <span className="text-brand-400">{p.categoryName}</span>
          <span className="text-ink-muted normal-case tracking-normal font-normal">{p.brandName}</span>
        </div>
        <Link href={`/shop/${p.slug}`} className="line-clamp-2 text-base font-semibold text-ink hover:text-brand-400 min-h-[2.75rem] leading-snug">
          {p.name}
        </Link>
        <div className="flex items-center gap-1.5 text-ink-dim">
          <Tag className="size-3.5" />
          <span className="font-mono text-xs">{p.sku}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {p.reviewCount > 0 ? (
            <StarRating value={p.rating} count={p.reviewCount} />
          ) : (
            <span className="text-[11px] text-ink-dim">No reviews yet</span>
          )}
          <CompareToggle slug={p.slug} size="sm" />
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-2xl font-extrabold text-ink">{formatPrice(p.priceCents)}</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await addToCartAction(p.id, 1);
                if (res.ok) {
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1200);
                }
              })
            }
            aria-label="Add to cart"
            className={cn(
              "grid size-10 place-items-center rounded-md text-white transition-colors disabled:opacity-50",
              added ? "bg-emerald-500" : "bg-bg-elev hover:bg-brand",
            )}
          >
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
