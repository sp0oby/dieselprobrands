import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe";
import { db, orders } from "@/db";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl font-bold text-ink">Missing session</h1>
      </div>
    );
  }
  let order: typeof orders.$inferSelect | null = null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(session_id);
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      order = row ?? null;
    }
  } catch {
    // ignore — show generic success
  }

  return (
    <div className="container-x py-20">
      <div className="card-surface mx-auto max-w-xl p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-4 text-3xl font-bold text-ink">Order Confirmed</h1>
        <p className="mt-2 text-ink-muted">
          Thanks for shopping with Diesel Pro Brands. We'll email you a receipt and tracking info shortly.
        </p>
        {order && (
          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-left text-ink-muted">Order number</dt>
            <dd className="text-right text-ink">DPB-{String(order.number).padStart(6, "0")}</dd>
            <dt className="text-left text-ink-muted">Total</dt>
            <dd className="text-right text-ink font-semibold">{formatPrice(order.totalCents)}</dd>
            <dt className="text-left text-ink-muted">Status</dt>
            <dd className="text-right text-emerald-600 capitalize">{order.status}</dd>
          </dl>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild><Link href="/orders">View Orders</Link></Button>
          <Button asChild variant="outline"><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </div>
    </div>
  );
}
