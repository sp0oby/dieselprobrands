import Link from "next/link";
import { ArrowRight, Award, Clock, ShieldCheck, Truck, Users, Flame, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { CategoryIcon } from "@/components/site/category-icon";
import { listHotDeals, listCategoriesWithCounts } from "@/lib/queries";
import { BRANDS } from "@/lib/site";
import { IMG } from "@/lib/products";
import { BrandLogo } from "@/components/site/brand-logo";

const TRUST = [
  { title: "Longest Warranty", subtitle: "Industry Leading", icon: ShieldCheck },
  { title: "Same-Day Ship", subtitle: "Time is Money", icon: Truck },
  { title: "Expert Team", subtitle: "Parts Rebuilders", icon: Award },
  { title: "4 Industries", subtitle: "We Have You Covered", icon: Users },
];

export default async function HomePage() {
  const [hot, categories] = await Promise.all([
    listHotDeals(8),
    listCategoriesWithCounts(),
  ]);
  const featuredBrands = BRANDS.filter((b) => b.featured).slice(0, 12);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div
          className="absolute inset-0 -z-20 opacity-15"
          style={{
            backgroundImage: `url('${IMG.heroConstruction}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(2px) brightness(0.9)",
          }}
        />
        <div className="container-x relative pt-16 pb-10 lg:pt-20 lg:pb-12">
          <span className="pill">
            <Sparkles className="size-3.5" /> Premium Diesel Parts &amp; Components
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[64px]">
            Power Your<br />
            <span className="heading-gradient">Diesel Engine</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-ink-muted">
            Turbo, fuel pump &amp; fuel injector experts. Serving agricultural, highway, construction, and marine
            industries with the longest warranty in the business.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/shop">Shop Now <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* trust strip — inline, borderless, sits at the bottom of the hero */}
        <div className="relative border-t border-black/[0.04] bg-black/30 backdrop-blur-sm">
          <div className="container-x grid grid-cols-2 gap-4 py-5 md:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-brand/15 text-brand-400">
                  <t.icon className="size-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  <p className="text-[11px] text-ink-muted">{t.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-x py-14 lg:py-16">
        <SectionHeader title="Shop by Category" subtitle="Find exactly what you need" cta={{ label: "View All", href: "/shop" }} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-black/[0.06] bg-bg-card p-4 text-center transition-all hover:border-brand/40 hover:-translate-y-0.5"
            >
              <CategoryIcon slug={c.slug} />
              <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-brand-600">{c.name}</h3>
              <p className="text-xs text-ink-muted"><span className="text-brand-600 font-semibold">{c.count.toLocaleString()}</span> items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* HOT DEALS */}
      <section className="container-x py-12 lg:py-16">
        <SectionHeader
          titlePrefix={<Flame className="size-7 text-brand-400" />}
          title="Hot Deals"
          subtitle="Best-selling diesel parts this month"
          cta={{ label: "View All Products", href: "/shop" }}
        />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hot.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">View All Products <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      {/* TRUSTED BRANDS */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          <SectionHeader title="Trusted Brands" subtitle="We supply parts from industry-leading brands" cta={{ label: "View All Brands", href: "/brands" }} />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {featuredBrands.map((b) => (
              <Link
                key={b.slug}
                href={`/brands/${b.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-black/[0.06] bg-bg-card px-4 py-5 text-center transition-all hover:border-brand/40 hover:-translate-y-0.5"
              >
                <BrandLogo brand={b} size="md" />
                <p className="text-[11px] text-ink-muted">
                  <span className="text-brand-600 font-semibold">{b.count.toLocaleString()}</span> products
                </p>
                <p className="text-[9px] uppercase tracking-wider text-ink-dim">{b.category}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/brands">View All Brands <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-brand p-10 md:p-16 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6), transparent 60%)" }}
          />
          <div className="relative">
            <Clock className="mx-auto size-10 text-white" />
            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">Need Expert Advice?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Our team of diesel specialists is ready to help you find the perfect parts for your engine.
            </p>
            <Button asChild size="lg" className="mt-6 bg-white text-brand hover:bg-white/90">
              <Link href="/contact">Contact Us Today <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, subtitle, cta, titlePrefix }: { title: string; subtitle: string; cta?: { label: string; href: string }; titlePrefix?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {titlePrefix}{title}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
      </div>
      {cta && (
        <Link href={cta.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-300">
          {cta.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
