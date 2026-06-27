"use client";
import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { compareStore, useCompareList } from "@/lib/compare-store";

export function CompareDrawer() {
  const list = useCompareList();
  if (list.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(640px,calc(100%-24px))] -translate-x-1/2 rounded-xl border border-brand/40 bg-bg-card/95 p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink">
          <GitCompareArrows className="size-4 text-brand-400" />
          <span><strong>{list.length}</strong> product{list.length === 1 ? "" : "s"} ready to compare</span>
          <span className="text-xs text-ink-dim">(max {compareStore.MAX})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => compareStore.clear()}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Clear
          </button>
          <Link
            href={`/compare?slugs=${encodeURIComponent(list.join(","))}`}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Compare →
          </Link>
        </div>
      </div>
    </div>
  );
}
