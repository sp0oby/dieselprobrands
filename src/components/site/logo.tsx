import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  className,
  variant = "full",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "full" | "mark";
}) {
  // logo-wide-v2.webp is the new DP PRO.com / DIESELPROBRANDS.COM mark,
  // trimmed to 800x271 (~2.95:1, no whitespace).
  const heights = { sm: 32, md: 44, lg: 56 } as const;
  const h = heights[size];
  const w = variant === "full" ? Math.round(h * 2.95) : h;
  const src = variant === "full" ? "/logo-wide-v2.webp" : "/logomark.webp";
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <Image
        src={src}
        alt="Diesel Pro Brands"
        width={w}
        height={h}
        priority
        className="object-contain"
        style={{ height: `${h}px`, width: "auto" }}
      />
    </Link>
  );
}
