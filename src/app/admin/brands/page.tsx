import { db, brands } from "@/db";
import { asc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export default async function AdminBrands() {
  const rows = await db.select().from(brands).orderBy(asc(brands.name));
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Brands</h1>
      <p className="mt-2 text-ink-muted">Brand records sync from the source data file. Edit <code className="text-brand-400">src/lib/site.ts</code> and re-seed to change.</p>
      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((b) => (
              <tr key={b.slug}>
                <td className="px-4 py-3 font-bold tracking-wider text-ink">{b.name}</td>
                <td className="px-4 py-3 text-ink-muted">{b.category}</td>
                <td className="px-4 py-3 text-ink-muted">{b.country}</td>
                <td className="px-4 py-3 text-right text-ink">{b.productCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{b.featured ? <Badge variant="brand">Featured</Badge> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
