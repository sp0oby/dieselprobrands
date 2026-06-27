"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { submitReturnRequest } from "@/app/actions/returns";

type Item = {
  id: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  alreadyReturned: number;
};

const REASONS = [
  { value: "defective", label: "Defective" },
  { value: "wrong_part", label: "Wrong part / didn't fit" },
  { value: "damaged_in_shipping", label: "Damaged in shipping" },
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "other", label: "Other" },
];

const STANDARD_RATE = 0.15;
const LARGE_THRESHOLD = 250000;
const LARGE_RATE = 0.20;

export function ReturnForm({ orderId, items }: { orderId: string; items: Item[] }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const totals = useMemo(() => {
    const selected = items
      .filter((it) => (quantities[it.id] ?? 0) > 0)
      .map((it) => ({ ...it, requestedQty: quantities[it.id] }));
    const subtotal = selected.reduce((s, it) => s + it.unitPriceCents * (it.requestedQty ?? 0), 0);
    const rate = subtotal > LARGE_THRESHOLD ? LARGE_RATE : STANDARD_RATE;
    const fee = Math.round(subtotal * rate);
    const refund = Math.max(0, subtotal - fee);
    return { selected, subtotal, rate, fee, refund };
  }, [items, quantities]);

  return (
    <form
      className="mt-8 grid gap-8 lg:grid-cols-[1fr,320px]"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const itemPayload = items
          .filter((it) => (quantities[it.id] ?? 0) > 0)
          .map((it) => ({ orderItemId: it.id, quantity: quantities[it.id] }));
        if (itemPayload.length === 0) { setError("Pick at least one item to return."); return; }
        if (!reason) { setError("Pick a reason."); return; }
        start(async () => {
          const res = await submitReturnRequest({ orderId, items: itemPayload, reason, note });
          if (!res.ok) setError(res.error);
          else router.push(`/account?rma=${res.rmaNumber}`);
        });
      }}
    >
      <div className="card-surface divide-y divide-black/[0.06]">
        {items.map((it) => {
          const remaining = it.quantity - it.alreadyReturned;
          const disabled = remaining <= 0;
          return (
            <div key={it.id} className="p-4 sm:p-6">
              <div className="grid grid-cols-[1fr,auto] items-start gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{it.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-dim">{it.sku}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Ordered: {it.quantity} · {disabled
                      ? <span className="text-amber-700">already returned</span>
                      : `up to ${remaining} returnable`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-ink">{formatPrice(it.unitPriceCents)} <span className="text-xs font-normal text-ink-muted">ea</span></p>
                  <select
                    value={quantities[it.id] ?? 0}
                    onChange={(e) => setQuantities((q) => ({ ...q, [it.id]: Number(e.target.value) }))}
                    disabled={disabled}
                    className="h-9 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink disabled:opacity-50"
                  >
                    {[0, ...Array.from({ length: Math.max(0, remaining) }, (_, i) => i + 1)].map((n) => (
                      <option key={n} value={n}>{n === 0 ? "Don't return" : `Return ${n}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="card-surface p-6 h-fit lg:sticky lg:top-24 space-y-5">
        <h2 className="text-lg font-bold text-ink">Refund Estimate</h2>
        <dl className="space-y-2 text-sm">
          <Row k="Items selected" v={String(totals.selected.length)} />
          <Row k="Items subtotal" v={formatPrice(totals.subtotal)} />
          <Row k={`Restocking fee (${Math.round(totals.rate * 100)}%)`} v={`− ${formatPrice(totals.fee)}`} accent="amber" />
          <div className="hairline pt-3"><Row k="Estimated refund" v={formatPrice(totals.refund)} large /></div>
        </dl>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason *</Label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink"
          >
            <option value="">Select reason…</option>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <p className="text-[11px] text-ink-muted">Defective / damaged returns waive the restocking fee at admin review.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Notes (optional)</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Anything our team should know" />
        </div>

        {error && <p className="text-sm text-amber-700">{error}</p>}

        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Submitting…" : "Submit Return Request"}
        </Button>
      </aside>
    </form>
  );
}

function Row({ k, v, large, accent }: { k: string; v: string; large?: boolean; accent?: "amber" }) {
  const valueClass = accent === "amber" ? "text-amber-700" : large ? "text-base font-bold text-ink" : "text-ink";
  return (
    <div className="flex justify-between">
      <dt className={large ? "text-base font-semibold text-ink" : "text-ink-muted"}>{k}</dt>
      <dd className={valueClass}>{v}</dd>
    </div>
  );
}
