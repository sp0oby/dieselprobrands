"use client";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Minus, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { removeFromCartAction, updateCartAction } from "@/app/actions/cart";

export type CartItemRowLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  unitPriceCents: number;        // your price
  retailUnitCents?: number;      // optional strikethrough
  quantity: number;
  imageUrl: string | null;
  brandSlug: string;
};

export function CartItemRow({ line }: { line: CartItemRowLine }) {
  const [pending, start] = useTransition();
  const hasDiscount = line.retailUnitCents != null && line.retailUnitCents > line.unitPriceCents;
  return (
    <div className="grid grid-cols-[80px,1fr,auto] items-center gap-4 p-4 sm:grid-cols-[100px,1fr,auto,auto] sm:gap-6 sm:p-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-bg-elev">
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl text-ink-dim">⚙️</div>
        )}
      </div>
      <div className="min-w-0">
        <Link href={`/shop/${line.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-400">
          {line.name}
        </Link>
        <p className="mt-1 font-mono text-[11px] text-ink-dim">{line.sku}</p>
        <p className="mt-1 text-sm font-bold text-ink sm:hidden">{formatPrice(line.unitPriceCents * line.quantity)}</p>
      </div>
      <div className="inline-flex h-9 items-center rounded-md border border-black/10 bg-bg-panel">
        <button
          onClick={() => start(async () => { await updateCartAction(line.productId, Math.max(0, line.quantity - 1)); })}
          disabled={pending}
          className="grid size-9 place-items-center text-ink-muted hover:text-ink disabled:opacity-50"
          aria-label="Decrease"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-ink">{line.quantity}</span>
        <button
          onClick={() => start(async () => { await updateCartAction(line.productId, line.quantity + 1); })}
          disabled={pending}
          className="grid size-9 place-items-center text-ink-muted hover:text-ink disabled:opacity-50"
          aria-label="Increase"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-ink">{formatPrice(line.unitPriceCents * line.quantity)}</p>
        <p className="text-xs text-ink-muted">
          {hasDiscount && <span className="mr-1 text-ink-dim line-through">{formatPrice(line.retailUnitCents!)}</span>}
          {formatPrice(line.unitPriceCents)} ea
        </p>
        <button
          onClick={() => start(async () => { await removeFromCartAction(line.productId); })}
          disabled={pending}
          className="mt-2 inline-flex items-center gap-1 text-xs text-ink-dim hover:text-brand-400 disabled:opacity-50"
        >
          <X className="size-3" /> Remove
        </button>
      </div>
    </div>
  );
}
