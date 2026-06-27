import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { BRANDS } from "@/lib/site";
import { searchProducts } from "@/lib/queries";
import { BrandLogo } from "@/components/site/brand-logo";

export async function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) notFound();

  const rows = await searchProducts({ brand: slug });

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16">
          <nav className="text-xs text-ink-muted">
            <Link href="/brands" className="hover:text-ink">Brands</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{brand.name}</span>
          </nav>
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="pill">{brand.category}</span>
              <div className="mt-4"><BrandLogo brand={brand} size="lg" /></div>
              <p className="mt-4 max-w-2xl text-lg text-ink-muted">{brand.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-2"><Globe className="size-4 text-brand-400" /> {brand.country}</span>
                <span>Est. {brand.founded}</span>
                <span className="text-brand-400 font-semibold">{brand.count.toLocaleString()} parts</span>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={`/shop?brand=${brand.slug}`}>Shop All {brand.name} <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="text-2xl font-bold text-ink">In stock from {brand.name}</h2>
        {rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-black/10 bg-bg-card p-12 text-center text-ink-muted">
            Browse the full catalog. We can also source any {brand.name} part on request — call <a className="text-brand-400" href="tel:+18669994361">(866) 999-4361</a>.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        )}
      </section>
    </>
  );
}
