"use client";
import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPromoAction, removePromoAction } from "@/app/actions/cart";

export function PromoForm({ currentCode, error: serverError }: { currentCode: string | null; error: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  if (currentCode && !serverError) {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-emerald-200">
          <Tag className="size-3.5" /> <span className="font-mono">{currentCode}</span>
        </span>
        <button
          type="button"
          onClick={() => start(() => removePromoAction())}
          disabled={pending}
          className="text-emerald-200/70 hover:text-emerald-200 disabled:opacity-50"
          aria-label="Remove promo"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await applyPromoAction(code);
          if (!res.ok) setError(res.error);
          else setCode("");
        });
      }}
    >
      <div className="flex gap-2">
        <Input
          name="code"
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono uppercase"
        />
        <Button type="submit" variant="outline" disabled={pending || !code}>
          Apply
        </Button>
      </div>
      {(error || serverError) && <p className="text-xs text-amber-300">{error ?? serverError}</p>}
    </form>
  );
}
