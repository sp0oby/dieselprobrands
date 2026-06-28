import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, FileDown, Package, Truck, RotateCcw } from "lucide-react";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, orderItems, products, returnRequests } from "@/db";
import { desc } from "drizzle-orm";
import { formatPrice, cn } from "@/lib/utils";
import { checkReturnEligibility } from "@/lib/returns";
import { resolveOrderAccess } from "@/lib/order-access";

const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;
  const access = await resolveOrderAccess(id, token);
  if (!access.ok) {
    if (access.reason === "not-found") notFound();
    if (access.reason === "needs-sign-in") redirect(`/sign-in?next=/orders/${id}`);
    notFound();
  }
  const { order } = access;
  // Preserve the guest token on outbound links from this page.
  const linkQs = access.viewer === "guest-token" && token ? `?t=${encodeURIComponent(token)}` : "";

  const items = await db
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
    .where(eq(orderItems.orderId, order.id));

  const rmas = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.orderId, order.id))
    .orderBy(desc(returnRequests.createdAt));

  const elig = checkReturnEligibility(order);
  const currentStep = Math.max(0, STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]));
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="container-x py-10">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-ink">DPB-{String(order.number).padStart(6, "0")}</h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={order.status === "delivered" ? "success" : order.status === "paid" ? "info" : isCancelled ? "outline" : "warning"}>
            {order.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/orders/${order.id}/invoice.pdf${linkQs}`} target="_blank" rel="noreferrer">
              <FileDown className="size-4" /> Invoice
            </a>
          </Button>
          {elig.eligible && access.viewer !== "guest-token" && (
            <Button asChild size="sm">
              <Link href={`/orders/${order.id}/return`}>
                <RotateCcw className="size-4" /> Request Return
              </Link>
            </Button>
          )}
        </div>
      </div>

      {rmas.length > 0 && (
        <div className="card-surface mt-6 p-5">
          <h2 className="text-base font-bold text-ink">Return Requests</h2>
          <ul className="mt-3 space-y-2">
            {rmas.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm">
                <div>
                  <p className="font-mono text-ink">RMA-{String(r.rmaNumber).padStart(6, "0")}</p>
                  <p className="text-xs text-ink-muted">{new Date(r.createdAt).toLocaleDateString()} · Refund est. {formatPrice(r.refundAmountCents)}</p>
                </div>
                <Badge variant={r.status === "refunded" ? "success" : r.status === "rejected" ? "outline" : r.status === "approved" || r.status === "received" ? "info" : "warning"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* status timeline */}
      {!isCancelled && (
        <div className="card-surface mt-8 p-6">
          <ol className="grid grid-cols-5 gap-2">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <li key={s} className="flex flex-col items-center text-center">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-xs font-bold transition-colors",
                      done ? "bg-brand text-white" : "bg-bg-elev text-ink-dim",
                    )}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("mt-2 text-xs capitalize", active ? "text-ink font-semibold" : done ? "text-ink-muted" : "text-ink-dim")}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        {/* line items */}
        <div className="card-surface divide-y divide-black/[0.06]">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-[80px,1fr,auto] items-center gap-4 p-4 sm:p-6">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-bg-elev">
                {it.imageUrl ? (
                  <Image src={it.imageUrl} alt={it.productName} fill className="object-cover" unoptimized />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl text-ink-dim">⚙️</div>
                )}
              </div>
              <div className="min-w-0">
                {it.slug ? (
                  <Link href={`/shop/${it.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-400">
                    {it.productName}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{it.productName}</p>
                )}
                <p className="mt-1 font-mono text-[11px] text-ink-dim">{it.productSku}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatPrice(it.unitPriceCents)} each · qty {it.quantity}</p>
              </div>
              <p className="text-sm font-bold text-ink">{formatPrice(it.unitPriceCents * it.quantity)}</p>
            </div>
          ))}
        </div>

        {/* sidebar */}
        <aside className="space-y-4 h-fit">
          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-ink">Order Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Subtotal" v={formatPrice(order.subtotalCents)} />
              <Row k="Shipping" v={order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)} />
              <Row k="Tax" v={formatPrice(order.taxCents)} />
              <div className="hairline pt-3"><Row k="Total" v={formatPrice(order.totalCents)} large /></div>
            </dl>
          </div>

          {order.shippingAddress && (
            <div className="card-surface p-6">
              <h2 className="text-base font-bold text-ink flex items-center gap-2"><Package className="size-4 text-brand-400" /> Shipping Address</h2>
              <address className="mt-3 not-italic text-sm text-ink-muted leading-relaxed">
                <p className="text-ink">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </address>
            </div>
          )}

          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-ink flex items-center gap-2"><Truck className="size-4 text-brand-400" /> Tracking</h2>
            {order.trackingNumber ? (
              <div className="mt-2 text-sm">
                <p className="font-mono text-ink">{order.trackingNumber}</p>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-brand-400 hover:text-brand-600">
                    Track package →
                  </a>
                )}
                {order.shippedAt && <p className="mt-1 text-xs text-ink-muted">Shipped {new Date(order.shippedAt).toLocaleDateString()}</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                {order.status === "shipped" || order.status === "delivered"
                  ? "Awaiting tracking number from carrier."
                  : "Tracking info is available once your order ships."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, large }: { k: string; v: string; large?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={large ? "text-base font-semibold text-ink" : "text-ink-muted"}>{k}</dt>
      <dd className={large ? "text-base font-bold text-ink" : "text-ink"}>{v}</dd>
    </div>
  );
}
