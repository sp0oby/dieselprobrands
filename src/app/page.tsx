import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { CategoryIcon } from "@/components/site/category-icon";
import { listHotDeals, listCategoriesWithCounts } from "@/lib/queries";
import { BRANDS } from "@/lib/site";
import { BrandLogo } from "@/components/site/brand-logo";

export default async function HomePage() {
  const [hot, categories] = await Promise.all([
    listHotDeals(8),
    listCategoriesWithCounts(),
  ]);
  const featuredBrands = BRANDS.filter((b) => b.featured).slice(0, 12);

  return (
    <>
      {/* HERO — the banner image carries the headline, product photos, and
          trust strip (Longest Warranty / Premium Quality / Expert Support /
          Fast Turnaround) so the page chrome around it stays minimal. */}
      <section className="relative">
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-black">
          <Image
            src="/hero.webp"
            alt="DieselPro Brands — Turbo, Fuel Pump &amp; Fuel Injector Experts. Longest warranty in the business."
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        {/* Quick CTAs sit cleanly below the banner with breathing room. The
            banner's bottom red stripe is part of the art, so the buttons live
            below it rather than crossing it. */}
        <div className="container-x flex flex-wrap justify-center gap-3 py-8 lg:py-10">
          <Button asChild size="lg">
            <Link href="/shop">Shop Parts <ArrowRight /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Talk to an Expert</Link>
          </Button>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-x py-14 lg:py-16">
        <SectionHeader title="Shop by Category" subtitle="Find exactly what you need" cta={{ label: "View All", href: "/shop" }} />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-bg-card transition-all hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-bg-elev">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <CategoryIcon slug={c.slug} />
                  </div>
                )}
                {/* subtle inner gradient at bottom for label contrast */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-3 text-center">
                <h3 className="text-sm font-semibold text-ink group-hover:text-brand-600">{c.name}</h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  <span className="text-brand-600 font-semibold">{c.count.toLocaleString()}</span> items
                </p>
              </div>
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
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center" style={{
          background: "radial-gradient(120% 100% at 50% 0%, #ef4444 0%, #d32f2f 45%, #991f1f 100%)",
        }}>
          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Soft top-corner light */}
          <div
            className="absolute -top-32 left-1/2 -z-10 h-64 w-[140%] -translate-x-1/2 opacity-30 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.9), transparent)" }}
          />
          <div className="relative">
            <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Clock className="size-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[40px]">Need Expert Advice?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Our team of diesel specialists is ready to help you find the perfect parts for your engine.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-brand shadow-lg hover:bg-white/95">
                <Link href="/contact">Contact Us Today <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href="/help">Browse FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, subtitle, cta, titlePrefix }: { title: string; subtitle: string; cta?: { label: string; href: string }; titlePrefix?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
      <div className="section-accent">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-[34px]">
          {titlePrefix}{title}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
      </div>
      {cta && (
        <Link href={cta.href} className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-400 transition-colors hover:text-brand-600">
          {cta.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
