import { db, products, orders } from "@/db";
import { count, sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const [productCount] = await db.select({ c: count() }).from(products);
  const [orderCount] = await db.select({ c: count() }).from(orders);
  const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(${orders.totalCents}),0)` }).from(orders).where(sql`${orders.status} = 'paid'`);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Tile label="Products" value={String(productCount.c)} />
        <Tile label="Orders" value={String(orderCount.c)} />
        <Tile label="Revenue (paid)" value={formatPrice(Number(revenue?.sum ?? 0))} />
      </div>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-6">
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-brand-400">{value}</p>
    </div>
  );
}
