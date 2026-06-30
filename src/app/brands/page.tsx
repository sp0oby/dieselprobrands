import Link from "next/link";
import { Shield, Globe, Award } from "lucide-react";
import { BRANDS, BRAND_CATEGORY_FILTERS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/site/brand-logo";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "All Brands" } = await searchParams;
  const filtered = filter === "All Brands" ? BRANDS : BRANDS.filter((b) => b.category === filter);

  return (
    <>
      {/* hero */}
      <section className="relative isolate overflow-hidden bg-bg-panel/40 border-b border-black/[0.04]">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16 lg:py-24">
          <span className="pill">✓ Authorized Dealer</span>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-ink sm:text-6xl">
            Shop by <span className="heading-gradient">Brand</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            We supply parts from the world's leading diesel engine and component brands. Every brand represents
            quality, reliability, and performance.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-2xl">
            <Stat n={`${BRANDS.length}+`} label="Brands" />
            <Stat n="25K+" label="Products" />
            <Stat n="100%" label="Authentic" />
            <Stat n="2-Year" label="Warranty" />
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <h2 className="text-2xl font-bold text-ink">Featured Brands</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BRANDS.filter((b) => b.featured).slice(0, 12).map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-black/[0.06] bg-bg-card p-4 transition-all hover:border-brand/40 hover:-translate-y-0.5"
            >
              <BrandLogo brand={b} size="md" />
              {b.count > 0 ? (
                <p className="text-xs text-ink-muted">
                  <span className="text-brand-600 font-semibold">{b.count.toLocaleString()}</span> parts
                </p>
              ) : b.slug === "dpb" ? (
                <p className="text-xs font-semibold text-brand-600">House Brand</p>
              ) : null}
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {BRAND_CATEGORY_FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "All Brands" ? "/brands" : `/brands?filter=${encodeURIComponent(f)}`}
              className={cn(
                "rounded-md border px-4 py-2 text-sm transition-colors",
                filter === f
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 bg-bg-panel text-ink-muted hover:text-ink",
              )}
            >
              {f}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Showing <span className="text-ink font-semibold">{filtered.length}</span> brands
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-black/[0.06] bg-bg-card p-6 transition-all hover:border-brand/40"
            >
              <div className="flex items-start justify-between">
                <BrandLogo brand={b} size="md" />
                {b.featured && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    ★ Featured
                  </span>
                )}
              </div>
              <span className="text-xs uppercase tracking-wider text-ink-dim">{b.category}</span>
              <p className="text-sm text-ink-muted leading-relaxed line-clamp-3">{b.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1"><Globe className="size-3.5" /> {b.country}</span>
                <span>Est. {b.founded}</span>
              </div>
              {b.count > 0 ? (
                <div className="hairline pt-3 text-sm">
                  <span className="font-bold text-brand-400">{b.count.toLocaleString()}</span>
                  <span className="text-ink-muted"> parts available</span>
                </div>
              ) : b.slug === "dpb" ? (
                <div className="hairline pt-3 text-sm font-semibold text-brand-600">House Brand</div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {/* why shop */}
      <section className="container-x py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Why Shop Brands With Us?</h2>
        <p className="mt-3 text-center text-ink-muted">We're authorized dealers for all major brands, ensuring authenticity and quality</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: Shield, title: "100% Authentic", body: "All parts are genuine OEM or premium aftermarket from authorized distributors" },
            { icon: Award, title: "Competitive Pricing", body: "Best prices on premium brands with price match guarantee" },
            { icon: Globe, title: "Global Network", body: "Direct relationships with suppliers worldwide" },
          ].map((b) => (
            <div key={b.title} className="card-surface p-6 text-center">
              <b.icon className="mx-auto size-8 text-brand-400" />
              <h3 className="mt-4 text-lg font-bold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-2xl font-extrabold text-brand-400">{n}</p>
      <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  );
}
