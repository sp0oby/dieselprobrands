import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq, and, inArray, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { db, orders, orderItems, returnRequests, returnItems } from "@/db";
import { checkReturnEligibility } from "@/lib/returns";
import { ReturnForm } from "@/components/site/return-form";

export default async function ReturnRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/orders/${id}/return`);

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();
  if (order.userId !== user.id) notFound();

  const elig = checkReturnEligibility(order);

  if (!elig.eligible) {
    return (
      <div className="container-x py-12">
        <Link href={`/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <div className="card-surface mx-auto mt-6 max-w-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-ink">Return not available</h1>
          <p className="mt-2 text-ink-muted">{elig.reason}</p>
          <Button asChild className="mt-6"><Link href="/contact">Contact support</Link></Button>
        </div>
      </div>
    );
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  // How many of each item have already been requested (excluding rejected)?
  const already = await db
    .select({
      orderItemId: returnItems.orderItemId,
      qty: sql<number>`coalesce(sum(${returnItems.quantity}), 0)`,
    })
    .from(returnItems)
    .innerJoin(returnRequests, eq(returnRequests.id, returnItems.requestId))
    .where(and(eq(returnRequests.orderId, order.id), sql`${returnRequests.status} <> 'rejected'`))
    .groupBy(returnItems.orderItemId);
  const alreadyMap = new Map(already.map((r) => [r.orderItemId, Number(r.qty)]));

  return (
    <div className="container-x py-12">
      <Link href={`/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to order
      </Link>
      <div className="mt-4">
        <h1 className="text-3xl font-bold text-ink">Request a Return</h1>
        <p className="mt-2 text-ink-muted">
          Order <span className="font-mono">DPB-{String(order.number).padStart(6, "0")}</span> ·
          <Badge variant="success" className="ml-2">{elig.daysRemaining} day(s) left to return</Badge>
        </p>
        <p className="mt-4 max-w-2xl text-sm text-ink-muted">
          Pick the items you want to send back. A 15% restocking fee applies to standard returns (20% on orders over $2,500).
          Defective or shipping-damaged parts are refunded in full. Once you submit, we'll email an RMA number and return-shipping instructions.
        </p>
      </div>

      <ReturnForm
        orderId={order.id}
        items={items.map((it) => ({
          id: it.id,
          name: it.productName,
          sku: it.productSku,
          unitPriceCents: it.unitPriceCents,
          quantity: it.quantity,
          alreadyReturned: alreadyMap.get(it.id) ?? 0,
        }))}
      />
    </div>
  );
}
