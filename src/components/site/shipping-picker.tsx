"use client";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { setShippingMethodAction } from "@/app/actions/cart";
import { formatPrice, cn } from "@/lib/utils";

type Method = {
  slug: string;
  name: string;
  description: string | null;
  etaDays: string;
};

export function ShippingPicker({
  methods,
  selected,
  rates,
}: {
  methods: Method[];
  selected: string | null;
  rates: Record<string, { cents: number; isFree: boolean }>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      {methods.map((m) => {
        const rate = rates[m.slug];
        const isSelected = selected === m.slug;
        return (
          <button
            key={m.slug}
            type="button"
            onClick={() => start(() => setShippingMethodAction(m.slug))}
            disabled={pending}
            className={cn(
              "w-full rounded-md border p-3 text-left transition-colors disabled:opacity-50",
              isSelected ? "border-brand bg-brand/[0.06]" : "border-black/10 bg-bg-panel hover:border-black/15",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className={cn("mt-1 grid size-4 shrink-0 place-items-center rounded-full border", isSelected ? "border-brand bg-brand text-white" : "border-black/15")}>
                  {isSelected && <Check className="size-2.5" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-ink-muted">{m.etaDays}{m.description ? ` · ${m.description}` : ""}</p>
                </div>
              </div>
              <span className={cn("text-sm font-semibold", rate?.isFree ? "text-emerald-300" : "text-ink")}>
                {rate?.isFree ? "FREE" : rate ? formatPrice(rate.cents) : "—"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
