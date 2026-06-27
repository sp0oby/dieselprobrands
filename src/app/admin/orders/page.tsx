import Link from "next/link";
import { db, orders } from "@/db";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { issueRefund } from "@/app/actions/refund";
import { setTrackingNumber } from "@/app/actions/tracking";

async function setStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
}

async function refundAction(formData: FormData) {
  "use server";
  await issueRefund(formData);
}

export default async function AdminOrders() {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Orders</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <p className="card-surface p-12 text-center text-ink-muted">No orders yet.</p>
        ) : (
          rows.map((o) => {
            const refundable = (o.status === "paid" || o.status === "shipped" || o.status === "delivered" || o.status === "processing") && o.refundedCents < o.totalCents && Boolean(o.stripePaymentIntentId);
            const remaining = o.totalCents - o.refundedCents;
            return (
              <div key={o.id} className="card-surface p-5">
                <div className="grid items-center gap-3 sm:grid-cols-[1fr,auto,auto,auto]">
                  <div>
                    <Link href={`/orders/${o.id}`} className="font-mono text-sm text-ink hover:text-brand-400">
                      DPB-{String(o.number).padStart(6, "0")}
                    </Link>
                    <p className="text-xs text-ink-muted">{o.email} · {new Date(o.createdAt).toLocaleString()}</p>
                    {o.refundedCents > 0 && <p className="text-xs text-amber-300 mt-1">Refunded {formatPrice(o.refundedCents)}</p>}
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatPrice(o.totalCents)}</p>
                  <Badge variant={o.status === "delivered" ? "success" : o.status === "refunded" ? "outline" : o.status === "paid" ? "info" : "warning"}>{o.status}</Badge>
                  <form action={setStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status} className="h-9 rounded-md border border-black/10 bg-bg-panel px-2 text-sm text-ink">
                      {["pending","paid","processing","shipped","delivered","cancelled","refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button type="submit" size="sm">Update</Button>
                  </form>
                </div>

                {(o.status === "paid" || o.status === "processing" || o.status === "shipped") && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-ink-muted hover:text-brand-400 list-none">
                      ▶ {o.trackingNumber ? `Tracking: ${o.trackingNumber}` : "Add tracking number"}
                    </summary>
                    <form action={setTrackingNumber} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <Input name="trackingNumber" defaultValue={o.trackingNumber ?? ""} placeholder="1Z..." />
                      <Button type="submit" size="sm" variant="outline">Save & mark shipped</Button>
                    </form>
                  </details>
                )}

                {refundable && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs text-ink-muted hover:text-brand-400 list-none">
                      <span className="group-open:rotate-90 inline-block transition-transform">▶</span> Issue refund (up to {formatPrice(remaining)})
                    </summary>
                    <form action={refundAction} className="mt-3 grid gap-2 sm:grid-cols-[160px,1fr,auto]">
                      <input type="hidden" name="orderId" value={o.id} />
                      <Input name="amount" type="number" step="0.01" min="0.01" max={(remaining / 100).toFixed(2)} placeholder={`Amount (max ${(remaining / 100).toFixed(2)})`} />
                      <Input name="reason" placeholder="Reason (optional)" />
                      <Button type="submit" variant="destructive" size="sm">Refund via Stripe</Button>
                    </form>
                    <p className="mt-1 text-[11px] text-ink-dim">Leave amount empty for full remaining refund. Stripe webhook will fire a credit note in Zoho Books automatically.</p>
                  </details>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
