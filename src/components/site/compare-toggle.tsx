"use client";
import { useEffect, useState } from "react";
import { GitCompareArrows, Check } from "lucide-react";
import { compareStore, useCompareList } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

export function CompareToggle({ slug, size = "md" }: { slug: string; size?: "sm" | "md" }) {
  const list = useCompareList();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = list.includes(slug);
  if (!mounted) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); compareStore.toggle(slug); }}
      aria-label={on ? "Remove from compare" : "Add to compare"}
      title={on ? "Remove from compare" : "Add to compare (max 4)"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
        on ? "border-brand bg-brand/15 text-brand-400" : "border-black/10 bg-bg-panel text-ink-muted hover:text-ink",
        size === "sm" ? "h-7" : "h-8",
      )}
    >
      {on ? <Check className="size-3" /> : <GitCompareArrows className="size-3" />} Compare
    </button>
  );
}
