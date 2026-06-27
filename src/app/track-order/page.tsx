import Link from "next/link";
import { Search, Package, Check } from "lucide-react";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { db, orders, orderItems, products } from "@/db";
import { formatPrice, cn } from "@/lib/utils";

const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"] as const;

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ number?: string; email?: string }> }) {
  const sp = await searchParams;
  const number = sp.number?.trim();
  const email = sp.email?.trim().toLowerCase();

  let foundOrder: typeof orders.$inferSelect | null = null;
  let items: Array<{ id: string; productName: string; productSku: string; quantity: number; unitPriceCents: number; imageUrl: string | null; slug: string | null }> = [];
  let errorMsg: string | null = null;

  if (number && email) {
    try {
      const cleaned = number.replace(/^DPB-?/i, "").replace(/^0+/, "");
      const n = parseInt(cleaned, 10);
      if (!Number.isFinite(n)) {
        errorMsg = "Order number must be like DPB-000123 or 123.";
      } else {
        const rows = await db
          .select()
          .from(orders)
          .where(and(eq(orders.number, n), eq(orders.email, email)))
          .limit(1);
        foundOrder = rows[0] ?? null;
        if (foundOrder) {
          items = await db
            .select({
              id: orderItems.id,
              productName: orderItems.productName,
              productSku: orderItems.productSku,
              unitPriceCents: orderItems.unitPriceCents,
              quantity: orderItems.quantity,
              slug: products.slug,
              imageUrl: products.imageUrl,
            })
            .from(orderItems)
            .leftJoin(products, eq(products.id, orderItems.productId))
            .where(eq(orderItems.orderId, foundOrder.id));
        } else {
          errorMsg = "We couldn't find an order with that number and email. Double-check both, or contact support.";
        }
      }
    } catch {
      errorMsg = "Lookup failed. Please try again or contact support.";
    }
  }

  const currentStep = foundOrder ? Math.max(0, STATUS_FLOW.indexOf(foundOrder.status as (typeof STATUS_FLOW)[number])) : 0;

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-extrabold text-ink">Track Your Order</h1>
        <p className="mt-2 text-ink-muted">
          Enter your order number and the email used at checkout to see real-time tracking. No account required.
        </p>

        <form className="card-surface mt-8 grid gap-4 p-6 sm:grid-cols-[1fr,1fr,auto] sm:items-end" method="GET">
          <div className="space-y-2">
            <Label htmlFor="number">Order number</Label>
            <Input id="number" name="number" placeholder="DPB-000123" defaultValue={number ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={email ?? ""} required />
          </div>
          <Button type="submit" className="h-10"><Search className="size-4" /> Track</Button>
        </form>

        {errorMsg && (
          <p className="mt-6 rounded-md border border-amber-300 bg-amber-100 p-4 text-sm text-amber-800">
            {errorMsg}
          </p>
        )}
      </div>

      {foundOrder && (
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold text-ink">DPB-{String(foundOrder.number).padStart(6, "0")}</p>
                <p className="text-xs text-ink-muted">Placed {new Date(foundOrder.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant={foundOrder.status === "delivered" ? "success" : foundOrder.status === "paid" ? "info" : "warning"}>
                {foundOrder.status}
              </Badge>
              <p className="text-base font-bold text-ink">{formatPrice(foundOrder.totalCents)}</p>
            </div>

            <ol className="mt-6 grid grid-cols-5 gap-2">
              {STATUS_FLOW.map((s, i) => {
                const done = i <= currentStep;
                return (
                  <li key={s} className="flex flex-col items-center text-center">
                    <span className={cn("grid size-9 place-items-center rounded-full text-xs font-bold", done ? "bg-brand text-white" : "bg-bg-elev text-ink-dim")}>
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={cn("mt-2 text-[11px] capitalize", done ? "text-ink-muted" : "text-ink-dim")}>{s}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="card-surface mt-4 divide-y divide-black/[0.06]">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 p-4 sm:p-6">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{it.productName}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-dim">{it.productSku}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink">{formatPrice(it.unitPriceCents * it.quantity)}</p>
                  <p className="text-xs text-ink-muted">qty {it.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {foundOrder.shippingAddress && (
            <div className="card-surface mt-4 p-6">
              <h2 className="text-base font-bold text-ink flex items-center gap-2"><Package className="size-4 text-brand-400" /> Ships To</h2>
              <address className="mt-3 not-italic text-sm text-ink-muted leading-relaxed">
                <p className="text-ink">{foundOrder.shippingAddress.fullName}</p>
                <p>{foundOrder.shippingAddress.line1}</p>
                {foundOrder.shippingAddress.line2 && <p>{foundOrder.shippingAddress.line2}</p>}
                <p>{foundOrder.shippingAddress.city}, {foundOrder.shippingAddress.state} {foundOrder.shippingAddress.zip}</p>
              </address>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-ink-muted">
            Need help? <Link href="/contact" className="text-brand-400 hover:text-brand-600">Contact our team</Link> with your order number.
          </p>
        </div>
      )}
    </div>
  );
}
