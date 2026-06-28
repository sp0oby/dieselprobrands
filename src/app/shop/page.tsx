import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/site/product-card";
import { SortBar } from "@/components/site/sort-bar";
import { searchProducts, searchByOemNumber, type Sort } from "@/lib/queries";
import { BRANDS, CATEGORIES } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOP_BRANDS = BRANDS.filter((b) => b.featured).slice(0, 8);
const OTHER_BRANDS = BRANDS.filter((b) => !TOP_BRANDS.includes(b));

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "under-200", label: "Under $200" },
  { value: "200-500", label: "$200 - $500" },
  { value: "500-1000", label: "$500 - $1000" },
  { value: "1000-plus", label: "$1000+" },
] as const;

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "best-rated", label: "Best Rated" },
];

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const category = sp.category ?? "all";
  const brand = sp.brand;
  const engine = sp.engine?.trim() || undefined;
  const priceRange = (sp.price as "all" | "under-200" | "200-500" | "500-1000" | "1000-plus" | undefined) ?? "all";
  const inStockOnly = sp.stock === "1";
  const sort = (sp.sort as Sort) ?? "featured";
  const q = sp.q;

  // If the search query looks like an OEM part number (has digits, no spaces),
  // first check the cross-reference index — single direct hit redirects to the OEM page.
  if (q && /^[a-zA-Z0-9-]{6,}$/.test(q.trim()) && /\d/.test(q)) {
    const oemMatches = await searchByOemNumber(q.trim());
    if (oemMatches.length > 0 && oemMatches.length <= 3) {
      redirect(`/search/oem/${encodeURIComponent(q.trim())}`);
    }
  }

  const items = await searchProducts({ category, brand, engine, priceRange, inStockOnly, sort, q });

  // Sidebar filters represent "browse this slice of the catalog" rather than
  // "refine my search", so applying a category/price/availability filter clears
  // any active search term. Sort changes preserve q (purely cosmetic).
  const link = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const browsing = "category" in overrides || "brand" in overrides || "engine" in overrides || "price" in overrides || "stock" in overrides;
    const merge = {
      category, brand, engine, price: priceRange, stock: inStockOnly ? "1" : undefined, sort,
      q: browsing ? undefined : q,
      ...overrides,
    };
    Object.entries(merge).forEach(([k, v]) => { if (v && v !== "all") next.set(k, v); });
    const s = next.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-ink">Shop Diesel Parts</h1>
          <p className="mt-2 text-ink-muted">
            <span className="text-ink font-semibold">{items.length}</span> products
            {q ? <> matching <span className="text-ink font-semibold">"{q}"</span></> : " available"}
          </p>
          {q && (
            <Link
              href={link({ q: undefined })}
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              ✕ Clear search
            </Link>
          )}
        </div>
        <SortBar category={category} brand={brand} engine={engine} priceRange={priceRange} inStockOnly={inStockOnly} sort={sort} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-8">
          <FilterGroup title="Categories">
            <FilterLink href={link({ category: undefined })} active={category === "all"}>All Parts</FilterLink>
            {CATEGORIES.map((c) => (
              <FilterLink key={c.slug} href={link({ category: c.slug })} active={category === c.slug}>
                {c.name}
              </FilterLink>
            ))}
          </FilterGroup>

          <FilterGroup title="Brand">
            <FilterLink href={link({ brand: undefined })} active={!brand}>All Brands</FilterLink>
            {TOP_BRANDS.map((b) => (
              <FilterLink key={b.slug} href={link({ brand: b.slug })} active={brand === b.slug}>
                {b.displayName}
              </FilterLink>
            ))}
            <details className="mt-1 group">
              <summary className="cursor-pointer rounded-md px-3 py-1.5 text-xs uppercase tracking-wider text-ink-dim hover:text-ink list-none">
                More brands ▾
              </summary>
              <div className="mt-1 space-y-1">
                {OTHER_BRANDS.map((b) => (
                  <FilterLink key={b.slug} href={link({ brand: b.slug })} active={brand === b.slug}>
                    {b.displayName}
                  </FilterLink>
                ))}
              </div>
            </details>
          </FilterGroup>

          <FilterGroup title="Engine Model">
            <form method="GET" className="space-y-2">
              <input type="hidden" name="category" value={category} />
              {brand && <input type="hidden" name="brand" value={brand} />}
              <input type="hidden" name="price" value={priceRange} />
              {inStockOnly && <input type="hidden" name="stock" value="1" />}
              <input
                type="text"
                name="engine"
                defaultValue={engine ?? ""}
                placeholder="e.g. C7, DL06, ISX15"
                className="w-full rounded-md border border-black/10 bg-bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-dim"
              />
              <button type="submit" className="w-full rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                Apply
              </button>
              {engine && (
                <Link href={link({ engine: undefined })} className="block text-center text-xs text-ink-muted hover:text-ink">
                  ✕ Clear engine
                </Link>
              )}
            </form>
          </FilterGroup>

          <FilterGroup title="Price Range">
            {PRICE_RANGES.map((r) => (
              <FilterLink key={r.value} href={link({ price: r.value })} active={priceRange === r.value}>
                {r.label}
              </FilterLink>
            ))}
          </FilterGroup>

          <FilterGroup title="Availability">
            <Link
              href={link({ stock: inStockOnly ? undefined : "1" })}
              className={cn(
                "flex items-center gap-2 rounded-md border border-black/10 bg-bg-panel px-3 py-2 text-sm",
                inStockOnly ? "border-brand/40 text-ink" : "text-ink-muted",
              )}
            >
              <span className={cn("inline-block size-4 rounded border border-black/15", inStockOnly && "bg-brand border-brand")} />
              In Stock Only
            </Link>
          </FilterGroup>

          <Link href="/shop" className="block rounded-md border border-black/10 px-3 py-2 text-center text-sm text-ink-muted hover:text-ink">
            Clear All Filters
          </Link>
        </aside>

        <section>
          {items.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-bg-card p-12 text-center text-ink-muted">
              No products match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  );
}
function FilterLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-brand text-white" : "text-ink-muted hover:bg-black/5 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
