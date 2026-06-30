"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/site";

/**
 * Renders a brand "logo".
 * 1. Tries /brands/{slug}.png — drop a real logo file there to override.
 * 2. Falls back to a styled wordmark using the brand's signature color.
 *
 * To add a real logo: save a transparent PNG to `public/brands/{slug}.png` (the slug from BRANDS).
 * The component auto-detects it.
 */
export function BrandLogo({
  brand,
  className,
  size = "md",
}: {
  brand: Brand;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const dims = {
    sm: { box: "h-10", img: 32 },
    md: { box: "h-14", img: 48 },
    lg: { box: "h-20", img: 72 },
  }[size];

  const src = brand.logoSrc ?? `/brands/${brand.slug}.png`;
  if (!imgFailed) {
    return (
      <span className={cn("relative inline-flex items-center justify-center", dims.box, className)}>
        <Image
          src={src}
          alt={brand.displayName}
          width={dims.img * 4}
          height={dims.img}
          className="h-full w-auto object-contain"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  // Fallback wordmark — brand color, all caps, slightly stylized.
  return (
    <span
      className={cn("inline-flex items-center justify-center font-black tracking-wider", dims.box, className)}
      style={{ color: brand.color, fontSize: size === "lg" ? "1.5rem" : size === "md" ? "1.125rem" : "0.875rem" }}
    >
      {brand.name}
    </span>
  );
}
