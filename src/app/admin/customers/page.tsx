import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { db, profiles, orders } from "@/db";
import { formatPrice } from "@/lib/utils";

export default async function AdminCustomers() {
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      companyName: profiles.companyName,
      customerType: profiles.customerType,
      tier: profiles.tier,
      isAdmin: profiles.isAdmin,
      createdAt: profiles.createdAt,
      orderCount: sql<number>`coalesce(count(${orders.id}), 0)`,
      lifetimeCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
    })
    .from(profiles)
    .leftJoin(orders, eq(orders.userId, profiles.id))
    .groupBy(profiles.id)
    .orderBy(desc(profiles.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Customers</h1>
      <p className="mt-2 text-ink-muted"><span className="text-ink font-semibold">{rows.length}</span> accounts</p>

      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Lifetime</th>
              <th className="px-4 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">No customer accounts yet.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-black/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="block">
                    <p className="text-ink font-medium">{c.fullName ?? c.email}</p>
                    <p className="text-xs text-ink-muted">{c.email}{c.companyName ? ` · ${c.companyName}` : ""}</p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.customerType === "business" ? "info" : "outline"}>{c.customerType}</Badge>
                  {c.isAdmin && <Badge variant="brand" className="ml-1">admin</Badge>}
                </td>
                <td className="px-4 py-3 capitalize text-ink">{c.tier}</td>
                <td className="px-4 py-3 text-right text-ink">{c.orderCount}</td>
                <td className="px-4 py-3 text-right text-ink">{formatPrice(Number(c.lifetimeCents))}</td>
                <td className="px-4 py-3 text-right text-ink-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
