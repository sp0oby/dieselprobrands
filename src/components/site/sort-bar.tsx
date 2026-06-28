"use client";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "best-rated", label: "Best Rated" },
];

export function SortBar({
  category, brand, engine, priceRange, inStockOnly, sort,
}: {
  category: string;
  brand?: string;
  engine?: string;
  priceRange: string;
  inStockOnly: boolean;
  sort: string;
}) {
  return (
    <form method="GET" className="flex gap-2">
      <input type="hidden" name="category" value={category} />
      {brand && <input type="hidden" name="brand" value={brand} />}
      {engine && <input type="hidden" name="engine" value={engine} />}
      <input type="hidden" name="price" value={priceRange} />
      {inStockOnly && <input type="hidden" name="stock" value="1" />}
      <select
        name="sort"
        defaultValue={sort}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
        className="h-10 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink"
      >
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </form>
  );
}
