import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { db, orders, orderItems } from "@/db";
import { desc, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/orders");

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl font-extrabold text-ink">Order History</h1>
      <p className="mt-2 text-ink-muted">Track and manage your previous orders</p>

      <div className="card-surface mt-6 p-6">
        <form action="/orders" method="GET" className="flex gap-2">
          <Input name="number" placeholder="Search by order number..." />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="card-surface mt-8 p-12 text-center">
          <h2 className="text-xl font-bold text-ink">No orders yet</h2>
          <p className="mt-2 text-ink-muted">When you place an order, it'll show up here.</p>
          <Button asChild className="mt-6"><Link href="/shop">Browse Parts</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

async function OrderRow({ order: o }: { order: typeof orders.$inferSelect }) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  return (
    <Link href={`/orders/${o.id}`} className="block card-surface p-6 transition-colors hover:border-black/[0.12]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-ink">DPB-{String(o.number).padStart(6, "0")}</p>
          <p className="text-xs text-ink-muted">Placed {new Date(o.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant={o.status === "delivered" ? "success" : o.status === "paid" ? "info" : o.status === "shipped" ? "info" : "warning"}>{o.status}</Badge>
        <p className="text-base font-bold text-ink">{formatPrice(o.totalCents)}</p>
      </div>
      <ul className="mt-4 grid gap-2">
        {items.slice(0, 3).map((it) => (
          <li key={it.id} className="flex items-center justify-between rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm">
            <span className="line-clamp-1 text-ink">{it.productName}</span>
            <span className="text-ink-muted">×{it.quantity} · {formatPrice(it.unitPriceCents * it.quantity)}</span>
          </li>
        ))}
        {items.length > 3 && <li className="text-xs text-ink-muted">+ {items.length - 3} more item(s)</li>}
      </ul>
    </Link>
  );
}
