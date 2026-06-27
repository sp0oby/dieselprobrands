"use client";
import { SlidersHorizontal } from "lucide-react";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "best-rated", label: "Best Rated" },
];

export function SortBar({
  category, priceRange, inStockOnly, sort,
}: {
  category: string;
  priceRange: string;
  inStockOnly: boolean;
  sort: string;
}) {
  return (
    <form method="GET" className="flex gap-2">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="price" value={priceRange} />
      {inStockOnly && <input type="hidden" name="stock" value="1" />}
      <button
        type="button"
        aria-label="Open filters"
        className="grid size-10 place-items-center rounded-md bg-brand text-white shadow-[0_8px_24px_-8px_rgba(211,47,47,0.6)] lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
      </button>
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
