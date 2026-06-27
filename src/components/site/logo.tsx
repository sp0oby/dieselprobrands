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
  // logo-wide.webp is already cropped 717x200 (~3.585:1), no whitespace.
  const heights = { sm: 28, md: 40, lg: 52 } as const;
  const h = heights[size];
  const w = variant === "full" ? Math.round(h * 3.585) : h;
  const src = variant === "full" ? "/logo-wide.webp" : "/logomark.webp";
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
