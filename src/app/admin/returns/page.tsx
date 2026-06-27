import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { db, returnRequests, orders, profiles, returnStatusValues } from "@/db";
import { formatPrice, cn } from "@/lib/utils";

export default async function AdminReturns({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const rows = await db
    .select({
      r: returnRequests,
      orderNumber: orders.number,
      customerEmail: orders.email,
      customerName: profiles.fullName,
    })
    .from(returnRequests)
    .innerJoin(orders, eq(orders.id, returnRequests.orderId))
    .leftJoin(profiles, eq(profiles.id, returnRequests.userId))
    .where(eq(returnRequests.status, status as (typeof returnStatusValues)[number]))
    .orderBy(desc(returnRequests.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Return Requests</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {returnStatusValues.map((s) => (
          <Link
            key={s}
            href={s === "pending" ? "/admin/returns" : `/admin/returns?status=${s}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm capitalize",
              status === s ? "border-brand bg-brand text-white" : "border-black/10 text-ink-muted hover:text-ink",
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="card-surface mt-6 p-12 text-center text-ink-muted">No {status} return requests.</p>
      ) : (
        <div className="card-surface mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left">RMA</th>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Refund est.</th>
                <th className="px-4 py-3 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {rows.map(({ r, orderNumber, customerEmail, customerName }) => (
                <tr key={r.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/returns/${r.id}`} className="font-mono text-ink hover:text-brand-400">
                      RMA-{String(r.rmaNumber).padStart(6, "0")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">DPB-{String(orderNumber).padStart(6, "0")}</td>
                  <td className="px-4 py-3 text-ink-muted">{customerName ?? customerEmail}</td>
                  <td className="px-4 py-3 text-ink-muted capitalize">{r.reason.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatPrice(r.refundAmountCents)}</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
