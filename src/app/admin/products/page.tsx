import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, products, brands as brandsTable, categories } from "@/db";
import { desc, eq } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function AdminProducts() {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      name: products.name,
      brandName: brandsTable.name,
      categoryName: categories.name,
      priceCents: products.priceCents,
      stockQty: products.stockQty,
      inStock: products.inStock,
    })
    .from(products)
    .innerJoin(brandsTable, eq(brandsTable.slug, products.brandSlug))
    .innerJoin(categories, eq(categories.slug, products.categorySlug))
    .orderBy(desc(products.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Products</h1>
        <Button asChild><Link href="/admin/products/new"><Plus /> New Product</Link></Button>
      </div>
      <div className="card-surface mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.02]">
                <td className="px-4 py-3"><Link href={`/admin/products/${r.id}`} className="text-ink hover:text-brand-400">{r.name}</Link></td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{r.sku}</td>
                <td className="px-4 py-3 text-ink-muted">{r.brandName}</td>
                <td className="px-4 py-3 text-ink-muted">{r.categoryName}</td>
                <td className="px-4 py-3 text-right text-ink">{formatPrice(r.priceCents)}</td>
                <td className="px-4 py-3 text-right text-ink-muted">{r.inStock ? r.stockQty : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
