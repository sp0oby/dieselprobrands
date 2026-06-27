import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import {
  db, carts, cartItems, products, profiles, customerPriceOverrides,
  promoCodes, promoRedemptions, isDbConfigured,
} from "@/db";
import { createClient } from "./supabase/server";
import type { Tier } from "@/db/schema";
import {
  priceCart, DEFAULT_TAX_RATE,
  type CartPricing, type PromoInput, type PriceLineInput,
} from "./pricing";
import { getShippingMethod, calculateShipping, type ShippingMethod } from "./shipping";

const CART_COOKIE = "dpb_cart";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  unitPriceCents: number; // retail
  quantity: number;
  imageUrl: string | null;
  brandSlug: string;
  categorySlug: string;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getOrCreateCartId(): Promise<{ cartId: string; isNew: boolean }> {
  const user = await getCurrentUser();
  const cookieStore = await cookies();

  if (user) {
    const existing = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, user.id)).limit(1);
    if (existing[0]) return { cartId: existing[0].id, isNew: false };
    const [created] = await db.insert(carts).values({ userId: user.id }).returning({ id: carts.id });
    return { cartId: created.id, isNew: true };
  }

  const sid = cookieStore.get(CART_COOKIE)?.value;
  if (sid) {
    const existing = await db.select({ id: carts.id }).from(carts).where(eq(carts.sessionId, sid)).limit(1);
    if (existing[0]) return { cartId: existing[0].id, isNew: false };
  }
  const newSid = randomUUID();
  const [created] = await db.insert(carts).values({ sessionId: newSid }).returning({ id: carts.id });
  try {
    cookieStore.set(CART_COOKIE, newSid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  } catch {}
  return { cartId: created.id, isNew: true };
}

export async function getCart(): Promise<{ id: string; lines: CartLine[]; subtotalCents: number; promoCode: string | null; shippingMethodSlug: string | null }> {
  if (!isDbConfigured()) return { id: "", lines: [], subtotalCents: 0, promoCode: null, shippingMethodSlug: null };
  const { cartId } = await getOrCreateCartId().catch(() => ({ cartId: "" }));
  if (!cartId) return { id: "", lines: [], subtotalCents: 0, promoCode: null, shippingMethodSlug: null };
  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  const rows = await db
    .select({
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      unitPriceCents: products.priceCents,
      imageUrl: products.imageUrl,
      brandSlug: products.brandSlug,
      categorySlug: products.categorySlug,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.cartId, cartId));
  const lines: CartLine[] = rows;
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  return { id: cartId, lines, subtotalCents, promoCode: cart?.promoCode ?? null, shippingMethodSlug: cart?.shippingMethodSlug ?? null };
}

export async function getCartCount(): Promise<number> {
  try {
    const { lines } = await getCart();
    return lines.reduce((s, l) => s + l.quantity, 0);
  } catch {
    return 0;
  }
}

// ---- pricing wrapper -------------------------------------------------------

export type PricedCart = CartPricing & {
  lineMeta: Record<string, CartLine>;
  tier: Tier;
  cartId: string;
  promoError: string | null;
  shippingMethod: ShippingMethod | null;
};

export async function getPricedCart(): Promise<PricedCart> {
  const empty: PricedCart = {
    lines: [], retailSubtotalCents: 0, tierDiscountCents: 0, volumeDiscountCents: 0,
    subtotalAfterDiscountsCents: 0, promoDiscountCents: 0, promoCode: null, freeShipping: false,
    shippingCents: 0, taxCents: 0, totalCents: 0,
    lineMeta: {}, tier: "retail", cartId: "", promoError: null, shippingMethod: null,
  };
  const { id: cartId, lines, promoCode, shippingMethodSlug } = await getCart();
  if (!cartId || lines.length === 0) return empty;

  const user = await getCurrentUser();
  let tier: Tier = "retail";
  let overridesByProduct = new Map<string, number>();
  if (user) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    tier = (profile?.tier ?? "retail") as Tier;
    if (lines.length) {
      const productIds = lines.map((l) => l.productId);
      const ovs = await db
        .select()
        .from(customerPriceOverrides)
        .where(and(eq(customerPriceOverrides.userId, user.id), inArray(customerPriceOverrides.productId, productIds)));
      overridesByProduct = new Map(ovs.map((o) => [o.productId, o.priceCents]));
    }
  }

  let promo: PromoInput | null = null;
  let promoError: string | null = null;
  if (promoCode) {
    const [row] = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode.toUpperCase())).limit(1);
    if (!row) {
      promoError = "Promo code no longer exists.";
    } else {
      promo = {
        code: row.code,
        kind: row.kind,
        value: row.value,
        minSubtotalCents: row.minSubtotalCents,
        maxDiscountCents: row.maxDiscountCents,
        maxUses: row.maxUses,
        usesCount: row.usesCount,
        perCustomerUses: row.perCustomerUses,
        stackable: row.stackable,
        scope: row.scope,
        scopeIds: row.scopeIds,
        allowedTiers: row.allowedTiers,
        startsAt: row.startsAt,
        expiresAt: row.expiresAt,
        active: row.active,
      };
    }
  }

  const inputs: PriceLineInput[] = lines.map((l) => ({
    productId: l.productId,
    brandSlug: l.brandSlug,
    categorySlug: l.categorySlug,
    retailPriceCents: l.unitPriceCents,
    quantity: l.quantity,
    customerOverrideCents: overridesByProduct.get(l.productId),
  }));

  const subtotalForShipping = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const shippingMethod = await getShippingMethod(shippingMethodSlug ?? "ground");
  const shippingCents = calculateShipping(shippingMethod, subtotalForShipping, itemCount);

  const pricing = priceCart({
    lines: inputs,
    tier,
    promo,
    shippingCents,
    taxRate: DEFAULT_TAX_RATE,
  });

  const lineMeta = Object.fromEntries(lines.map((l) => [l.productId, l]));
  return { ...pricing, lineMeta, tier, cartId, promoError, shippingMethod };
}

// ---- mutations -------------------------------------------------------------

export async function addToCart(productId: string, quantity = 1) {
  const { cartId } = await getOrCreateCartId();
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  } else {
    await db.insert(cartItems).values({ cartId, productId, quantity });
  }
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const { cartId } = await getOrCreateCartId();
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  }
}

export async function removeFromCart(productId: string) {
  const { cartId } = await getOrCreateCartId();
  await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
}

export async function clearCart() {
  const { cartId } = await getOrCreateCartId();
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.update(carts).set({ promoCode: null }).where(eq(carts.id, cartId));
}

export async function applyPromoCode(rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };
  const [row] = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
  if (!row || !row.active) return { ok: false, error: "Invalid or expired code." };
  const now = new Date();
  if (row.expiresAt && row.expiresAt < now) return { ok: false, error: "This code has expired." };
  if (row.maxUses != null && row.usesCount >= row.maxUses) return { ok: false, error: "This code has been fully redeemed." };
  const { cartId } = await getOrCreateCartId();
  await db.update(carts).set({ promoCode: code }).where(eq(carts.id, cartId));
  return { ok: true };
}

export async function removePromoCode() {
  const { cartId } = await getOrCreateCartId();
  await db.update(carts).set({ promoCode: null }).where(eq(carts.id, cartId));
}

export async function setShippingMethod(slug: string) {
  const { cartId } = await getOrCreateCartId();
  await db.update(carts).set({ shippingMethodSlug: slug }).where(eq(carts.id, cartId));
}
