import "server-only";
import { eq } from "drizzle-orm";
import { db, orders, orderItems, profiles } from "@/db";
import { isZohoConfigured, zohoFetch, logSync, getAccessTokenFor } from "./client";

// Map an order to a Zoho Books invoice payload.
async function buildInvoicePayload(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("order not found");
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  let customerId: string | undefined;
  if (order.userId) {
    const [p] = await db.select({ zohoContactId: profiles.zohoContactId }).from(profiles).where(eq(profiles.id, order.userId)).limit(1);
    customerId = p?.zohoContactId ?? undefined;
  }
  return {
    order,
    items,
    payload: {
      customer_id: customerId,
      contact_persons: customerId ? undefined : [{ email: order.email }],
      reference_number: `DPB-${String(order.number).padStart(6, "0")}`,
      invoice_number: `INV-${String(order.number).padStart(6, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      line_items: items.map((it) => ({
        name: it.productName,
        sku: it.productSku,
        rate: it.unitPriceCents / 100,
        quantity: it.quantity,
      })),
      shipping_charge: order.shippingCents / 100,
      adjustment: -(order.promoDiscountCents / 100),
      adjustment_description: order.promoCode ?? undefined,
      notes: `Stripe session ${order.stripeSessionId ?? "?"}`,
    },
  };
}

// ---- push invoice on paid checkout -----------------------------------------

export async function pushInvoice(orderId: string): Promise<{ ok: boolean; invoiceId?: string; error?: string }> {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "books", operation: "push_invoice", status: "ok", error: "skipped: not configured" });
    return { ok: true };
  }
  try {
    const { payload } = await buildInvoicePayload(orderId);
    const data = await zohoFetch<{ invoice?: { invoice_id: string } }>("books", "/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const invoiceId = data.invoice?.invoice_id;
    if (invoiceId) {
      await db.update(orders).set({ zohoInvoiceId: invoiceId, zohoSyncedAt: new Date() }).where(eq(orders.id, orderId));
    }
    await logSync({ service: "books", operation: "push_invoice", status: "ok", recordsAffected: 1, durationMs: Date.now() - started });
    return { ok: true, invoiceId };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "books", operation: "push_invoice", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// ---- record customer payment -----------------------------------------------

export async function pushPayment(orderId: string, amountCents: number, stripePaymentIntentId?: string | null) {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "books", operation: "push_payment", status: "ok", error: "skipped: not configured" });
    return { ok: true };
  }
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order?.zohoInvoiceId) return { ok: false, error: "no invoice id on order" };
    const data = await zohoFetch<{ payment?: { payment_id: string } }>("books", "/customerpayments", {
      method: "POST",
      body: JSON.stringify({
        customer_id: order.userId ? (await db.select({ id: profiles.zohoContactId }).from(profiles).where(eq(profiles.id, order.userId)).limit(1))[0]?.id ?? undefined : undefined,
        payment_mode: "creditcard",
        amount: amountCents / 100,
        date: new Date().toISOString().slice(0, 10),
        reference_number: stripePaymentIntentId ?? order.stripeSessionId ?? `DPB-${order.number}`,
        invoices: [{ invoice_id: order.zohoInvoiceId, amount_applied: amountCents / 100 }],
      }),
    });
    await logSync({ service: "books", operation: "push_payment", status: "ok", recordsAffected: 1, durationMs: Date.now() - started });
    return { ok: true, paymentId: data.payment?.payment_id };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "books", operation: "push_payment", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// ---- credit note on refund -------------------------------------------------

export async function pushCreditNote(orderId: string, amountCents: number, reason?: string) {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "books", operation: "push_credit_note", status: "ok", error: "skipped: not configured" });
    return { ok: true };
  }
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { ok: false, error: "order not found" };
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    let customerId: string | undefined;
    if (order.userId) {
      const [p] = await db.select({ zohoContactId: profiles.zohoContactId }).from(profiles).where(eq(profiles.id, order.userId)).limit(1);
      customerId = p?.zohoContactId ?? undefined;
    }

    // For partial refunds we still attach one line item totalling the refund amount.
    // For full refunds we mirror the original line items.
    const isFull = amountCents >= order.totalCents;
    const lineItems = isFull
      ? items.map((it) => ({ name: it.productName, sku: it.productSku, rate: it.unitPriceCents / 100, quantity: it.quantity }))
      : [{ name: `Partial refund — DPB-${String(order.number).padStart(6, "0")}`, rate: amountCents / 100, quantity: 1 }];

    const data = await zohoFetch<{ creditnote?: { creditnote_id: string } }>("books", "/creditnotes", {
      method: "POST",
      body: JSON.stringify({
        customer_id: customerId,
        contact_persons: customerId ? undefined : [{ email: order.email }],
        reference_number: `DPB-${String(order.number).padStart(6, "0")}-REFUND`,
        creditnote_number: `CN-${String(order.number).padStart(6, "0")}-${Date.now().toString(36)}`,
        date: new Date().toISOString().slice(0, 10),
        invoice_id: order.zohoInvoiceId ?? undefined,
        line_items: lineItems,
        notes: reason ?? "Customer refund",
      }),
    });
    const cnId = data.creditnote?.creditnote_id;
    if (cnId) {
      await db.update(orders).set({ zohoCreditNoteId: cnId, zohoSyncedAt: new Date() }).where(eq(orders.id, orderId));
    }
    await logSync({ service: "books", operation: "push_credit_note", status: "ok", recordsAffected: 1, durationMs: Date.now() - started });
    return { ok: true, creditNoteId: cnId };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "books", operation: "push_credit_note", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// ---- PDF stream from Books -------------------------------------------------

// Returns a binary PDF buffer if the invoice exists in Books, else null.
export async function fetchInvoicePdf(invoiceId: string): Promise<ArrayBuffer | null> {
  if (!isZohoConfigured()) return null;
  try {
    const token = await getAccessTokenFor("books");
    const dc = process.env.ZOHO_DATA_CENTER ?? "com";
    const orgId = process.env.ZOHO_ORG_ID ?? "";
    const url = `https://www.zohoapis.${dc}/books/v3/invoices/${invoiceId}?accept=pdf&organization_id=${encodeURIComponent(orgId)}`;
    const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}
