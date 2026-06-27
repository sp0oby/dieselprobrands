import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, shippingMethods } from "@/db";

export type ShippingMethod = typeof shippingMethods.$inferSelect;

// Fallback methods used when DB isn't configured or table is empty.
// Same shape as DB rows; seeded into Postgres by db:seed.
export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  { slug: "ground", name: "Standard Ground", description: "Best value for non-urgent orders.", baseCents: 1499, perItemCents: 0, freeShippingMinCents: 50000, etaDays: "3-5 business days", sortOrder: 1, active: true },
  { slug: "two-day", name: "2-Day Expedited", description: "Faster transit for time-sensitive parts.", baseCents: 2999, perItemCents: 200, freeShippingMinCents: null, etaDays: "2 business days", sortOrder: 2, active: true },
  { slug: "overnight", name: "Overnight", description: "Next-business-day delivery.", baseCents: 4999, perItemCents: 500, freeShippingMinCents: null, etaDays: "Next business day", sortOrder: 3, active: true },
  { slug: "freight", name: "LTL Freight", description: "Required for heavy assemblies (engine blocks, full crates).", baseCents: 19900, perItemCents: 0, freeShippingMinCents: null, etaDays: "5-10 business days", sortOrder: 4, active: true },
];

export async function listShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const rows = await db.select().from(shippingMethods).where(eq(shippingMethods.active, true)).orderBy(asc(shippingMethods.sortOrder));
    if (rows.length) return rows;
  } catch {
    // db not configured — fall through
  }
  return DEFAULT_SHIPPING_METHODS;
}

export async function getShippingMethod(slug: string): Promise<ShippingMethod | null> {
  try {
    const [row] = await db.select().from(shippingMethods).where(eq(shippingMethods.slug, slug)).limit(1);
    if (row) return row;
  } catch {}
  return DEFAULT_SHIPPING_METHODS.find((m) => m.slug === slug) ?? null;
}

export function calculateShipping(method: ShippingMethod | null, subtotalCents: number, itemCount: number): number {
  if (!method) return 0;
  if (method.freeShippingMinCents != null && subtotalCents >= method.freeShippingMinCents) return 0;
  return method.baseCents + method.perItemCents * Math.max(0, itemCount - 1);
}

// Best-guess carrier tracking URL from tracking number prefix.
export function trackingUrlFor(trackingNumber: string): string {
  const tn = trackingNumber.trim();
  if (/^1Z[0-9A-Z]{16}$/.test(tn)) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}`;
  if (/^\d{12,15}$/.test(tn) && tn.length <= 15) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tn)}`;
  if (/^\d{20,22}$/.test(tn)) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}`;
  // generic
  return `https://parcelsapp.com/en/tracking/${encodeURIComponent(tn)}`;
}
