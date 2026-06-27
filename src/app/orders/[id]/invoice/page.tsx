import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, orders, orderItems, profiles, products } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

// Print-friendly HTML invoice. Users can browser-print-to-PDF.
// If Zoho Books has the invoice, /api/orders/[id]/invoice.pdf serves the real PDF instead.

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();
  // Only the order owner or admins can view
  if (order.userId && user?.id !== order.userId) {
    const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
    if (!user?.email || !allow.includes(user.email.toLowerCase())) {
      redirect(`/sign-in?next=/orders/${id}/invoice`);
    }
  }

  const items = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      productSku: orderItems.productSku,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const customer = order.userId ? (await db.select().from(profiles).where(eq(profiles.id, order.userId)).limit(1))[0] : null;
  const invoiceNumber = `INV-${String(order.number).padStart(6, "0")}`;

  return (
    <html>
      <head>
        <title>{invoiceNumber} · Diesel Pro Brands</title>
        <style>{`
          @media print { .no-print { display: none } body { background: white !important; color: black !important; } }
          body { background: white; color: #111; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; margin: 0; padding: 32px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #111; }
          .brand { font-size: 24px; font-weight: 800; color: #d32f2f; letter-spacing: -0.02em; }
          .small { font-size: 12px; color: #555; line-height: 1.5; }
          h1 { font-size: 28px; margin: 24px 0 4px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
          .meta h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 32px; }
          th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
          th { background: #fafafa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
          td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
          .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
          .totals table { width: 320px; }
          .totals td { border: none; padding: 4px 0; }
          .totals tr.grand td { font-weight: 800; font-size: 18px; border-top: 2px solid #111; padding-top: 12px; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #555; line-height: 1.6; }
          .actions { margin-bottom: 16px; }
          button { background: #d32f2f; color: white; border: 0; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        `}</style>
      </head>
      <body>
        <div className="actions no-print">
          <button onClick={undefined} suppressHydrationWarning>
            <span onClick={() => undefined as never}>Print or Save as PDF</span>
          </button>
          {/* the actual print button is JS-driven below */}
          <PrintButton />
        </div>

        <div className="header">
          <div>
            <p className="brand">DIESEL PRO BRANDS</p>
            <p className="small">{SITE.address.street}<br />{SITE.address.city}, {SITE.address.state} {SITE.address.zip}<br />{SITE.phone} · {SITE.emailSupport}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1>Invoice</h1>
            <p className="small"><strong>{invoiceNumber}</strong></p>
            <p className="small">Order #DPB-{String(order.number).padStart(6, "0")}</p>
            <p className="small">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="meta">
          <div>
            <h2>Bill To</h2>
            <p className="small">
              <strong>{customer?.fullName ?? order.email}</strong><br />
              {customer?.companyName && <>{customer.companyName}<br /></>}
              {order.email}
            </p>
          </div>
          {order.shippingAddress && (
            <div>
              <h2>Ship To</h2>
              <p className="small">
                <strong>{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                {order.shippingAddress.country}
              </p>
            </div>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th className="num">Qty</th>
              <th className="num">Unit</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.productName}</td>
                <td className="small">{it.productSku}</td>
                <td className="num">{it.quantity}</td>
                <td className="num">{formatPrice(it.unitPriceCents)}</td>
                <td className="num">{formatPrice(it.unitPriceCents * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <table>
            <tbody>
              {order.tierDiscountCents > 0 && <tr><td>Tier discount</td><td className="num">−{formatPrice(order.tierDiscountCents)}</td></tr>}
              {order.volumeDiscountCents > 0 && <tr><td>Volume discount</td><td className="num">−{formatPrice(order.volumeDiscountCents)}</td></tr>}
              {order.promoDiscountCents > 0 && <tr><td>Promo ({order.promoCode})</td><td className="num">−{formatPrice(order.promoDiscountCents)}</td></tr>}
              <tr><td>Subtotal</td><td className="num">{formatPrice(order.subtotalCents)}</td></tr>
              <tr><td>Shipping</td><td className="num">{order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}</td></tr>
              <tr><td>Tax</td><td className="num">{formatPrice(order.taxCents)}</td></tr>
              <tr className="grand"><td>Total</td><td className="num">{formatPrice(order.totalCents)}</td></tr>
              {order.refundedCents > 0 && <tr><td>Refunded</td><td className="num">−{formatPrice(order.refundedCents)}</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="footer">
          <p>
            Payment via Stripe (ref: {order.stripePaymentIntentId ?? order.stripeSessionId ?? "—"}).
            Status: <strong>{order.status}</strong>.
          </p>
          <p>Thank you for your business. Returns within 60 days per our Returns & Warranty policy at dieselprobrands.com/returns-warranty.</p>
        </div>
      </body>
    </html>
  );
}

function PrintButton() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.querySelector('.actions button').addEventListener('click', () => window.print());`,
      }}
    />
  );
}
