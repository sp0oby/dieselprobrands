import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

// Renders 5 stars with half-star precision so 4.2, 4.5, and 4.8 look different.
// Rounding rule: bottom of bucket = empty, mid = half, top = full.
//   < n+0.25 → empty
//   < n+0.75 → half
//   else     → full
export function StarRating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 text-ink-muted", className)}>
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => {
          const diff = value - i;
          const state: "empty" | "half" | "full" = diff >= 0.75 ? "full" : diff >= 0.25 ? "half" : "empty";
          if (state === "half") {
            return (
              <span key={i} className="relative inline-block size-3.5">
                <Star className="absolute inset-0 size-3.5 text-white/15" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="size-3.5 fill-brand text-brand" />
                </span>
              </span>
            );
          }
          return (
            <Star
              key={i}
              className={cn("size-3.5", state === "full" ? "fill-brand text-brand" : "text-white/15")}
            />
          );
        })}
      </div>
      {count != null && <span className="text-xs text-ink-muted">({count})</span>}
    </div>
  );
}
