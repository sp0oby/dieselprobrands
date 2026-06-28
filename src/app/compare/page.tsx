import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { getProductsBySlugs } from "@/lib/queries";
import { BRANDS, CATEGORIES } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

type CompareProduct = {
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty: number;
  badge: string | null;
  imageUrl: string | null;
  specs: Record<string, string>;
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ slugs?: string }> }) {
  const { slugs = "" } = await searchParams;
  const wanted = slugs.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const rows = await getProductsBySlugs(wanted);
  const products: CompareProduct[] = rows.map((r) => {
    // DB rows and seed rows have slightly different shapes — normalize.
    const isDbRow = "brandSlug" in r;
    return {
      slug: r.slug,
      sku: r.sku,
      name: r.name,
      brand: isDbRow ? (r as { brandSlug: string }).brandSlug : (r as { brand: string }).brand,
      category: isDbRow ? (r as { categorySlug: string }).categorySlug : (r as { category: string }).category,
      priceCents: r.priceCents,
      rating: Number(r.rating),
      reviewCount: r.reviewCount,
      inStock: r.inStock,
      stockQty: r.stockQty,
      badge: r.badge ?? null,
      imageUrl: r.imageUrl ?? null,
      specs: (r.specs ?? {}) as Record<string, string>,
    };
  });

  if (products.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-3xl font-bold text-ink">Nothing to compare yet</h1>
        <p className="mt-2 text-ink-muted">Tap "Compare" on any product card to add it here.</p>
        <Button asChild className="mt-6"><Link href="/shop">Browse Parts <ArrowRight /></Link></Button>
      </div>
    );
  }

  // Union of all spec keys across selected products
  const specKeys = Array.from(
    products.reduce((set, p) => {
      Object.keys(p.specs ?? {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl font-extrabold text-ink">Compare</h1>
      <p className="mt-2 text-ink-muted">{products.length} of {4} products</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-x-4">
          <thead>
            <tr className="align-top">
              <th className="w-40 text-left text-xs uppercase tracking-wider text-ink-dim font-semibold">&nbsp;</th>
              {products.map((p) => (
                <th key={p.slug} className="text-left">
                  <Link href={`/shop/${p.slug}`} className="block card-surface p-3 hover:border-black/[0.12]">
                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-bg-elev">
                      {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />}
                      {p.badge && <div className="absolute left-2 top-2"><ProductBadge kind={p.badge} /></div>}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink">{p.name}</p>
                    <p className="font-mono text-[11px] text-ink-dim">{p.sku}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <Row label="Price" cells={products.map((p) => <strong className="text-ink">{formatPrice(p.priceCents)}</strong>)} />
            <Row label="Brand" cells={products.map((p) => BRANDS.find((b) => b.slug === p.brand)?.displayName ?? p.brand)} />
            <Row label="Category" cells={products.map((p) => CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category)} />
            <Row label="Rating" cells={products.map((p) => <StarRating value={p.rating} count={p.reviewCount} />)} />
            <Row label="In stock" cells={products.map((p) => p.inStock ? <span className="text-emerald-600">Yes ({p.stockQty})</span> : <span className="text-amber-600">No</span>)} />
            {specKeys.map((k) => (
              <Row key={k} label={k} cells={products.map((p) => p.specs?.[k] ?? <span className="text-ink-dim">—</span>)} />
            ))}
            <tr>
              <td className="py-3"></td>
              {products.map((p) => (
                <td key={p.slug} className="py-3">
                  <Button asChild className="w-full"><Link href={`/shop/${p.slug}`}>View product</Link></Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr className="align-top">
      <th scope="row" className="py-3 text-left text-xs uppercase tracking-wider text-ink-dim font-semibold">{label}</th>
      {cells.map((c, i) => <td key={i} className="py-3 text-ink-muted">{c}</td>)}
    </tr>
  );
}
