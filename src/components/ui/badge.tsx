import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
  {
    variants: {
      variant: {
        default: "bg-black/5 text-ink",
        brand: "bg-brand text-white",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-800",
        info: "bg-sky-500/20 text-sky-700",
        outline: "border border-black/10 text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Solid pill badges matching the Figma site exactly.
// BEST SELLER / PRO GRADE / HOT DEAL = solid red, NEW = solid blue.
export function ProductBadge({ kind }: { kind: string | null | undefined }) {
  if (!kind) return null;
  const bg = kind === "NEW" ? "bg-sky-500" : "bg-brand";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
        bg,
      )}
    >
      {kind}
    </span>
  );
}
