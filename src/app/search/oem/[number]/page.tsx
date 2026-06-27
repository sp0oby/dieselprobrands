import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { searchByOemNumber } from "@/lib/queries";

export default async function OemSearchPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const decoded = decodeURIComponent(number);
  const matches = await searchByOemNumber(decoded);

  return (
    <div className="container-x py-12">
      <p className="text-xs uppercase tracking-wider text-brand-400 font-semibold">OEM cross-reference</p>
      <h1 className="mt-2 text-4xl font-extrabold text-ink">
        Replacements for <span className="font-mono">{decoded}</span>
      </h1>
      <p className="mt-2 text-ink-muted">
        {matches.length === 0
          ? "We don't have a direct cross-reference for that part number yet — but we may still have it. Try a broader search or contact us."
          : `${matches.length} product${matches.length === 1 ? "" : "s"} cross-reference this OEM number.`}
      </p>

      {matches.length === 0 ? (
        <div className="card-surface mt-8 p-12 text-center">
          <p className="text-ink-muted">Can't find what you need?</p>
          <Button asChild className="mt-4"><Link href="/contact">Contact our team <ArrowRight /></Link></Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {matches.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
