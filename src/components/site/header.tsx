"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/brands", label: "Brands" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      {/* top utility bar */}
      <div className="hidden border-b border-black/[0.04] bg-bg-panel/90 lg:block">
        <div className="container-x flex h-9 items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-4">
            <a href={SITE.phoneHref} className="hover:text-ink">📞 {SITE.phone}</a>
            <span>✉️ {SITE.emailSupport}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/track-order" className="hover:text-ink">Track Order</Link>
            <span className="text-white/15">|</span>
            <Link href="/help" className="hover:text-ink">Help</Link>
          </div>
        </div>
      </div>

      <div className="container-x flex h-20 items-center gap-6">
        <Logo />
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form action="/shop" method="GET" className="ml-auto hidden max-w-md flex-1 items-center gap-2 lg:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
            <input
              name="q"
              placeholder="Search for parts..."
              className="h-10 w-full rounded-md border border-black/10 bg-bg-panel pl-10 pr-12 text-sm text-ink placeholder:text-ink-dim focus-visible:border-brand/60 focus-visible:outline-none"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-black/10 bg-black/5 px-1.5 py-0.5 text-[10px] text-ink-muted">⌘K</kbd>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link href="/account" className="hidden lg:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Account">
              <User />
            </Button>
          </Link>
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* mobile menu */}
      <div className={cn("lg:hidden border-t border-black/[0.06]", open ? "block" : "hidden")}>
        <div className="container-x py-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-black/5"
            >
              {n.label}
            </Link>
          ))}
          <Link href="/account" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-ink hover:bg-black/5">Account</Link>
          <Link href="/track-order" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-ink hover:bg-black/5">Track Order</Link>
          <Link href="/help" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-ink hover:bg-black/5">Help</Link>
        </div>
      </div>
    </header>
  );
}
