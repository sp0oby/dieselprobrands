import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db, returnRequests, returnItems, orderItems, orders, profiles, returnItemDecisionValues } from "@/db";
import { formatPrice } from "@/lib/utils";
import {
  approveReturnRequest, rejectReturnRequest, markReturnReceived,
  setItemDecision, processReturnRefund,
} from "@/app/actions/returns";

export default async function AdminReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [req] = await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
  if (!req) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.id, req.orderId)).limit(1);
  const customer = req.userId ? (await db.select().from(profiles).where(eq(profiles.id, req.userId)).limit(1))[0] : null;
  const items = await db
    .select({
      ri: returnItems,
      productName: orderItems.productName,
      productSku: orderItems.productSku,
      unitPriceCents: orderItems.unitPriceCents,
      orderQty: orderItems.quantity,
    })
    .from(returnItems)
    .innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId))
    .where(eq(returnItems.requestId, id));

  return (
    <div>
      <Link href="/admin/returns" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to returns
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-ink">RMA-{String(req.rmaNumber).padStart(6, "0")}</h1>
          {order && (
            <p className="text-sm text-ink-muted">
              Order <Link href={`/orders/${order.id}`} className="text-brand-400">DPB-{String(order.number).padStart(6, "0")}</Link>
              {customer && <> · {customer.fullName ?? customer.email}</>}
            </p>
          )}
        </div>
        <Badge variant={req.status === "refunded" ? "success" : req.status === "rejected" ? "outline" : "warning"}>{req.status}</Badge>
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-base font-bold text-ink">Customer submission</h2>
        <dl className="mt-3 grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
          <DL k="Reason" v={<span className="capitalize">{req.reason.replace(/_/g, " ")}</span>} />
          <DL k="Submitted" v={new Date(req.createdAt).toLocaleString()} />
          <DL k="Items subtotal" v={formatPrice(req.refundAmountCents + req.restockingFeeCents)} />
          <DL k="Restocking fee" v={formatPrice(req.restockingFeeCents)} />
          <DL k="Refund estimate" v={<span className="font-semibold text-ink">{formatPrice(req.refundAmountCents)}</span>} />
        </dl>
        {req.customerNote && (
          <p className="mt-4 rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm text-ink-muted">
            <span className="text-xs uppercase tracking-wider text-ink-dim">Customer note</span>
            <br />{req.customerNote}
          </p>
        )}
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-base font-bold text-ink">Items being returned</h2>
        <ul className="mt-3 space-y-3">
          {items.map(({ ri, productName, productSku, unitPriceCents, orderQty }) => (
            <li key={ri.id} className="rounded-md border border-black/[0.06] bg-bg-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{productName}</p>
                  <p className="text-xs font-mono text-ink-dim">{productSku}</p>
                  <p className="mt-1 text-xs text-ink-muted">Returning {ri.quantity} of {orderQty} · {formatPrice(unitPriceCents * ri.quantity)}</p>
                </div>
                <form action={setItemDecision} className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <input type="hidden" name="itemId" value={ri.id} />
                  <input type="hidden" name="requestId" value={req.id} />
                  <select name="decision" defaultValue={ri.decision} className="h-9 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink capitalize">
                    {returnItemDecisionValues.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Input name="conditionNote" defaultValue={ri.conditionNote ?? ""} placeholder="Condition note" className="h-9 w-48" />
                  <Button type="submit" size="sm" variant="outline">Save</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {req.status === "pending" && (
        <div className="card-surface mt-6 p-6">
          <h2 className="text-base font-bold text-ink">Review</h2>
          <form action={approveReturnRequest} className="mt-3 grid gap-3 sm:grid-cols-[160px,1fr,auto]">
            <input type="hidden" name="id" value={req.id} />
            <Input name="refundAmount" type="number" step="0.01" placeholder={`Refund (default ${(req.refundAmountCents / 100).toFixed(2)})`} />
            <Input name="note" placeholder="Note to customer (optional)" />
            <Button type="submit">Approve</Button>
          </form>
          <form action={rejectReturnRequest} className="mt-3 grid gap-3 sm:grid-cols-[1fr,auto]">
            <input type="hidden" name="id" value={req.id} />
            <Input name="note" placeholder="Rejection reason" required />
            <Button type="submit" variant="outline">Reject</Button>
          </form>
        </div>
      )}

      {req.status === "approved" && (
        <div className="card-surface mt-6 p-6">
          <h2 className="text-base font-bold text-ink">Approved — awaiting package</h2>
          <p className="mt-2 text-sm text-ink-muted">When the package arrives, mark it received, finalize per-item decisions, then process the refund.</p>
          <form action={markReturnReceived} className="mt-3">
            <input type="hidden" name="id" value={req.id} />
            <Button type="submit">Mark Received</Button>
          </form>
        </div>
      )}

      {req.status === "received" && (
        <div className="card-surface mt-6 p-6">
          <h2 className="text-base font-bold text-ink">Received — process refund</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Refund <strong>{formatPrice(req.refundAmountCents)}</strong> to the original payment method. Stripe will refund the charge; Zoho Books receives a credit note.
          </p>
          <form action={processReturnRefund} className="mt-3">
            <input type="hidden" name="id" value={req.id} />
            <Button type="submit">Process Refund</Button>
          </form>
        </div>
      )}

      {req.status === "refunded" && (
        <div className="card-surface mt-6 p-6 border-emerald-500/30 bg-emerald-500/[0.04]">
          <h2 className="text-base font-bold text-ink">Refunded</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {formatPrice(req.refundAmountCents)} refunded {req.refundedAt ? new Date(req.refundedAt).toLocaleDateString() : ""}.
            Stripe refund: <span className="font-mono text-xs">{req.stripeRefundId ?? "—"}</span>. Zoho credit note: <span className="font-mono text-xs">{req.zohoCreditNoteId ?? "pending"}</span>.
          </p>
        </div>
      )}

      {req.reviewerNote && (
        <p className="mt-4 text-xs text-ink-muted">Reviewer note: "{req.reviewerNote}"</p>
      )}
    </div>
  );
}

function DL({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink-dim">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
