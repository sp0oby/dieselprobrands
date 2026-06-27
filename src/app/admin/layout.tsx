import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, LayoutDashboard, Package, Tag, ShoppingBag, Users, ClipboardCheck, BadgePercent, Plug, RotateCcw, Star, Download } from "lucide-react";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();
  if (!ok) redirect("/sign-in?next=/admin");

  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
        <aside className="space-y-1">
          <div className="card-surface p-4 flex items-center gap-2">
            <Shield className="size-5 text-brand-400" />
            <p className="text-sm font-semibold text-ink">Admin</p>
          </div>
          <nav className="card-surface p-2 space-y-1">
            <AdminLink href="/admin" icon={LayoutDashboard}>Dashboard</AdminLink>
            <AdminLink href="/admin/products" icon={Package}>Products</AdminLink>
            <AdminLink href="/admin/brands" icon={Tag}>Brands</AdminLink>
            <AdminLink href="/admin/orders" icon={ShoppingBag}>Orders</AdminLink>
            <AdminLink href="/admin/customers" icon={Users}>Customers</AdminLink>
            <AdminLink href="/admin/applications" icon={ClipboardCheck}>Applications</AdminLink>
            <AdminLink href="/admin/returns" icon={RotateCcw}>Returns / RMA</AdminLink>
            <AdminLink href="/admin/reviews" icon={Star}>Reviews</AdminLink>
            <AdminLink href="/admin/promos" icon={BadgePercent}>Promo Codes</AdminLink>
            <AdminLink href="/admin/scrapers" icon={Download}>Scrapers</AdminLink>
            <AdminLink href="/admin/integrations" icon={Plug}>Integrations</AdminLink>
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function AdminLink({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-black/5 hover:text-ink">
      <Icon className="size-4" />
      {children}
    </Link>
  );
}
