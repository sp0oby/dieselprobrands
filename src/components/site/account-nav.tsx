"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin, CreditCard, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav className="card-surface p-2 space-y-1">
      {TABS.map((t) => {
        const active = t.exact ? path === t.href : path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-brand text-white" : "text-ink-muted hover:bg-black/5 hover:text-ink",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
