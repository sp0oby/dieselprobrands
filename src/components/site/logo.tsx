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
  // /dpb-logo.png is the official Diesel Pro Brands logo with the white
  // background keyed out (D mark + "DIESELPRO BRANDS.COM" wordmark, ~3.34:1).
  const heights = { sm: 36, md: 52, lg: 68 } as const;
  const h = heights[size];
  const w = variant === "full" ? Math.round(h * 3.34) : h;
  const src = "/dpb-logo.png";
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
