import "server-only";
import { eq, inArray } from "drizzle-orm";
import {
  db, products, warehouses, productStock, orders, orderItems, profiles,
} from "@/db";
import { isZohoConfigured, zohoFetch, logSync } from "./client";

// ---- pull warehouses --------------------------------------------------------

type ZohoWarehouse = {
  warehouse_id: string;
  warehouse_name: string;
  city?: string;
  state?: string;
  zip?: string;
  is_primary?: boolean;
  status?: string;
};

export async function pullWarehouses(): Promise<{ ok: boolean; count?: number; error?: string }> {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "inventory", operation: "pull_warehouses", status: "ok", error: "skipped: not configured" });
    return { ok: true, count: 0 };
  }
  try {
    const data = await zohoFetch<{ warehouses: ZohoWarehouse[] }>("inventory", "/warehouses");
    const rows = data.warehouses ?? [];
    for (const w of rows) {
      await db
        .insert(warehouses)
        .values({
          id: w.warehouse_id,
          name: w.warehouse_name,
          city: w.city ?? null,
          state: w.state ?? null,
          zip: w.zip ?? null,
          isPrimary: w.is_primary ?? false,
          active: (w.status ?? "active") === "active",
        })
        .onConflictDoUpdate({
          target: warehouses.id,
          set: {
            name: w.warehouse_name,
            city: w.city ?? null,
            state: w.state ?? null,
            zip: w.zip ?? null,
            isPrimary: w.is_primary ?? false,
            active: (w.status ?? "active") === "active",
          },
        });
    }
    await logSync({ service: "inventory", operation: "pull_warehouses", status: "ok", recordsAffected: rows.length, durationMs: Date.now() - started });
    return { ok: true, count: rows.length };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "inventory", operation: "pull_warehouses", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// ---- pull items + stock -----------------------------------------------------

type ZohoItem = {
  item_id: string;
  sku?: string;
  name: string;
  rate?: number;
  status?: string;
  warehouses?: Array<{ warehouse_id: string; warehouse_actual_available_for_sale_stock: number }>;
};

export async function pullItemStock(pageLimit = 5): Promise<{ ok: boolean; count?: number; error?: string }> {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "inventory", operation: "pull_items", status: "ok", error: "skipped: not configured" });
    return { ok: true, count: 0 };
  }
  try {
    let updated = 0;
    for (let page = 1; page <= pageLimit; page++) {
      const data = await zohoFetch<{ items: ZohoItem[]; page_context: { has_more_page: boolean } }>(
        "inventory",
        "/items",
        { params: { page, per_page: 200 } },
      );
      const items = data.items ?? [];
      if (!items.length) break;

      // Match Zoho items to our products by SKU.
      const skus = items.map((i) => i.sku).filter(Boolean) as string[];
      const ours = skus.length
        ? await db.select({ id: products.id, sku: products.sku }).from(products).where(inArray(products.sku, skus))
        : [];
      const bySku = new Map(ours.map((p) => [p.sku, p.id]));

      for (const item of items) {
        const productId = item.sku ? bySku.get(item.sku) : undefined;
        if (!productId) continue;
        await db.update(products).set({ zohoItemId: item.item_id }).where(eq(products.id, productId));
        for (const w of item.warehouses ?? []) {
          await db
            .insert(productStock)
            .values({ productId, warehouseId: w.warehouse_id, quantity: Math.floor(w.warehouse_actual_available_for_sale_stock ?? 0) })
            .onConflictDoUpdate({
              target: [productStock.productId, productStock.warehouseId],
              set: { quantity: Math.floor(w.warehouse_actual_available_for_sale_stock ?? 0), updatedAt: new Date() },
            });
        }
        updated++;
      }
      if (!data.page_context?.has_more_page) break;
    }
    await logSync({ service: "inventory", operation: "pull_items", status: "ok", recordsAffected: updated, durationMs: Date.now() - started });
    return { ok: true, count: updated };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "inventory", operation: "pull_items", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// ---- push Sales Order on paid checkout --------------------------------------

export async function pushSalesOrder(orderId: string): Promise<{ ok: boolean; soId?: string; error?: string }> {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "inventory", operation: "push_order", status: "ok", error: "skipped: not configured" });
    return { ok: true };
  }
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return { ok: false, error: "order not found" };
    const items = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        productSku: orderItems.productSku,
        unitPriceCents: orderItems.unitPriceCents,
        quantity: orderItems.quantity,
        zohoItemId: products.zohoItemId,
      })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, orderId));

    let contactId: string | undefined;
    if (order.userId) {
      const [profile] = await db.select({ zohoContactId: profiles.zohoContactId }).from(profiles).where(eq(profiles.id, order.userId)).limit(1);
      contactId = profile?.zohoContactId ?? undefined;
    }

    const payload = {
      customer_id: contactId,
      // If no Zoho contact: include billing email so Zoho creates one.
      contact_persons: contactId ? undefined : [{ email: order.email }],
      reference_number: `DPB-${String(order.number).padStart(6, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      line_items: items.map((it) => ({
        item_id: it.zohoItemId ?? undefined,
        name: it.productName,
        sku: it.productSku,
        rate: it.unitPriceCents / 100,
        quantity: it.quantity,
      })),
      shipping_charge: order.shippingCents / 100,
      adjustment: -(order.promoDiscountCents / 100),
      adjustment_description: order.promoCode ?? undefined,
      notes: `Stripe session ${order.stripeSessionId ?? "?"}`,
    };

    const data = await zohoFetch<{ salesorder?: { salesorder_id: string } }>("inventory", "/salesorders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const soId = data.salesorder?.salesorder_id;
    if (soId) {
      await db.update(orders).set({ zohoSalesOrderId: soId, zohoSyncedAt: new Date() }).where(eq(orders.id, orderId));
    }
    await logSync({ service: "inventory", operation: "push_order", status: "ok", recordsAffected: 1, durationMs: Date.now() - started });
    return { ok: true, soId };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "inventory", operation: "push_order", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}
