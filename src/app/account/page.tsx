import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { db, orders, businessApplications, wishlistItems, addresses } from "@/db";
import { desc, eq, sql, count } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { BusinessAppFinalizer } from "@/components/site/business-app-finalizer";

export default async function AccountOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  const [recent, [orderCount], [pendingApp], [wishlistCount], [addressCount]] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(5),
    db.select({ c: count() }).from(orders).where(eq(orders.userId, user.id)),
    db.select().from(businessApplications).where(eq(businessApplications.userId, user.id)).orderBy(desc(businessApplications.createdAt)).limit(1),
    db.select({ c: count() }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)),
    db.select({ c: count() }).from(addresses).where(eq(addresses.userId, user.id)),
  ]);

  return (
    <div className="space-y-6">
      {/* Finalizer auto-submits a pending business app if one is queued in sessionStorage */}
      <BusinessAppFinalizer />

      {pendingApp?.status === "pending" && (
        <div className="card-surface p-4 flex items-start gap-3 border-amber-300 bg-amber-500/[0.04]">
          <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Business application under review</p>
            <p className="text-xs text-ink-muted">Submitted {new Date(pendingApp.createdAt).toLocaleDateString()} — typically 1–2 business days.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/business-application">Details</Link></Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat n={String(orderCount.c)} label="Total Orders" />
        <Stat n={String(wishlistCount.c)} label="Wishlist Items" />
        <Stat n={String(addressCount.c)} label="Saved Addresses" />
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Recent Orders</h2>
          <Button asChild variant="ghost" size="sm"><Link href="/orders">View All</Link></Button>
        </div>
        {recent.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-muted">No orders yet. <Link href="/shop" className="text-brand-400">Start shopping</Link></p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="grid grid-cols-[1fr,auto,auto] items-center gap-4 rounded-md border border-black/[0.06] bg-bg-panel p-4 hover:border-black/[0.12]">
                  <div>
                    <p className="font-mono text-sm text-ink">DPB-{String(o.number).padStart(6, "0")}</p>
                    <p className="text-xs text-ink-muted">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={o.status === "delivered" ? "success" : o.status === "paid" ? "info" : "warning"}>{o.status}</Badge>
                  <p className="text-sm font-semibold text-ink">{formatPrice(o.totalCents)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="card-surface p-5">
      <p className="text-3xl font-extrabold text-brand-400">{n}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  );
}
