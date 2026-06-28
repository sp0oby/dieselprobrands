"use client";
import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/app/actions/cart";

export function AddToCartButton({ productId }: { productId: string }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 items-center rounded-md border border-black/10 bg-bg-panel">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-12 place-items-center text-ink-muted hover:text-ink"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-semibold text-ink">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="grid size-12 place-items-center text-ink-muted hover:text-ink"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          size="lg"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await addToCartAction(productId, qty);
              if (res.ok) {
                setAdded(true);
                setTimeout(() => setAdded(false), 1500);
              } else {
                setError(res.error);
              }
            })
          }
        >
          {added ? <><Check /> Added</> : <><ShoppingCart /> Add to Cart</>}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
