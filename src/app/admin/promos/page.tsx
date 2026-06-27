import Link from "next/link";
import { Plus } from "lucide-react";
import { desc, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, promoCodes, promoRedemptions } from "@/db";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function AdminPromos() {
  const rows = await db
    .select({
      promo: promoCodes,
      redeemedCents: sql<number>`coalesce(sum(${promoRedemptions.discountCents}), 0)`,
    })
    .from(promoCodes)
    .leftJoin(promoRedemptions, eq(promoRedemptions.promoId, promoCodes.id))
    .groupBy(promoCodes.id)
    .orderBy(desc(promoCodes.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Promo Codes</h1>
        <Button asChild><Link href="/admin/promos/new"><Plus /> New Code</Link></Button>
      </div>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Scope</th>
              <th className="px-4 py-3 text-right">Uses</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3 text-right">Expires</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-muted">No promo codes yet.</td></tr>}
            {rows.map(({ promo, redeemedCents }) => {
              const expired = promo.expiresAt && promo.expiresAt < new Date();
              return (
                <tr key={promo.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/promos/${promo.id}`} className="font-mono font-semibold text-ink hover:text-brand-400">
                      {promo.code}
                    </Link>
                    {promo.description && <p className="text-xs text-ink-muted">{promo.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {promo.kind === "percent" ? `${promo.value}%` : promo.kind === "fixed" ? formatPrice(promo.value) : "Free ship"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted capitalize">{promo.scope}</td>
                  <td className="px-4 py-3 text-right text-ink">{promo.usesCount}{promo.maxUses ? ` / ${promo.maxUses}` : ""}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatPrice(Number(redeemedCents))}</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {!promo.active ? <Badge variant="outline">paused</Badge>
                      : expired ? <Badge variant="outline">expired</Badge>
                      : <Badge variant="success">active</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
