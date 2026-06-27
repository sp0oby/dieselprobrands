// Pure pricing math — no DB, no auth, no I/O.
// Used by the cart, PDP, checkout API, and admin previews. Same numbers everywhere.

import type { Tier } from "@/db/schema";

// ---- tier discount (per-unit) ----------------------------------------------

export const TIER_RATES: Record<Tier, number> = {
  retail: 0,
  dealer: 0.12,
  wholesale: 0.22,
  vip: 0.30,
};

export const TIER_LABELS: Record<Tier, string> = {
  retail: "Retail",
  dealer: "Dealer",
  wholesale: "Wholesale",
  vip: "VIP",
};

// ---- volume discount (per-line, by quantity) -------------------------------

// Scope says: 10-49: 10%, 50-99: 18%, 100+: 25%
export type VolumeTier = { minQty: number; rate: number; label: string };
export const VOLUME_TIERS: VolumeTier[] = [
  { minQty: 100, rate: 0.25, label: "100+ units" },
  { minQty: 50, rate: 0.18, label: "50-99 units" },
  { minQty: 10, rate: 0.10, label: "10-49 units" },
];

export function volumeRate(qty: number): number {
  for (const t of VOLUME_TIERS) if (qty >= t.minQty) return t.rate;
  return 0;
}
export function volumeLabel(qty: number): string | null {
  for (const t of VOLUME_TIERS) if (qty >= t.minQty) return t.label;
  return null;
}
export function nextVolumeTier(qty: number): VolumeTier | null {
  // Returns the next better tier you could reach.
  for (let i = VOLUME_TIERS.length - 1; i >= 0; i--) {
    if (qty < VOLUME_TIERS[i].minQty) return VOLUME_TIERS[i];
  }
  return null;
}

// ---- promo evaluation ------------------------------------------------------

export type PromoInput = {
  code: string;
  kind: "percent" | "fixed" | "free_shipping";
  value: number;           // percent: 0-100; fixed: cents
  minSubtotalCents: number;
  maxDiscountCents?: number | null;
  maxUses?: number | null;
  usesCount: number;
  perCustomerUses?: number | null;
  stackable: boolean;
  scope: "all" | "category" | "brand" | "product";
  scopeIds: string[];
  allowedTiers: string[];
  startsAt?: Date | null;
  expiresAt?: Date | null;
  active: boolean;
};

export type PromoEvaluation =
  | { ok: true; discountCents: number; freeShipping: boolean }
  | { ok: false; reason: string };

export function evaluatePromo(args: {
  promo: PromoInput;
  subtotalCents: number;       // post-tier, post-volume subtotal
  scopedSubtotalCents?: number; // subtotal of lines this promo applies to
  tier: Tier;
  now?: Date;
  userRedemptions?: number;
}): PromoEvaluation {
  const { promo, subtotalCents, scopedSubtotalCents = subtotalCents, tier } = args;
  const now = args.now ?? new Date();
  if (!promo.active) return { ok: false, reason: "This code is no longer active." };
  if (promo.startsAt && now < promo.startsAt) return { ok: false, reason: "This code isn't active yet." };
  if (promo.expiresAt && now > promo.expiresAt) return { ok: false, reason: "This code has expired." };
  if (promo.maxUses != null && promo.usesCount >= promo.maxUses) return { ok: false, reason: "This code is out of redemptions." };
  if (promo.minSubtotalCents > 0 && subtotalCents < promo.minSubtotalCents) {
    return { ok: false, reason: `Add ${((promo.minSubtotalCents - subtotalCents) / 100).toFixed(2)} more to use this code.` };
  }
  if (promo.allowedTiers.length && !promo.allowedTiers.includes(tier)) {
    return { ok: false, reason: "This code isn't available for your account tier." };
  }
  if (promo.perCustomerUses != null && (args.userRedemptions ?? 0) >= promo.perCustomerUses) {
    return { ok: false, reason: "You've already used this code the maximum number of times." };
  }

  if (promo.kind === "free_shipping") return { ok: true, discountCents: 0, freeShipping: true };

  let discount = 0;
  if (promo.kind === "percent") discount = Math.floor((scopedSubtotalCents * promo.value) / 100);
  else discount = Math.min(promo.value, scopedSubtotalCents);
  if (promo.maxDiscountCents != null) discount = Math.min(discount, promo.maxDiscountCents);
  return { ok: true, discountCents: Math.max(0, discount), freeShipping: false };
}

// ---- cart pricing (line + cart total) --------------------------------------

export type PriceLineInput = {
  productId: string;
  categorySlug: string;
  brandSlug: string;
  retailPriceCents: number;        // products.priceCents
  quantity: number;
  customerOverrideCents?: number;  // if set, replaces retailPriceCents
};

export type PricedLine = {
  productId: string;
  quantity: number;
  retailUnitCents: number;         // shown as strikethrough
  baseUnitCents: number;           // after customer override, before tier/volume
  tierDiscountUnitCents: number;
  volumeDiscountUnitCents: number;
  yourUnitCents: number;
  lineRetailCents: number;
  lineYourCents: number;
  lineSavingsCents: number;
  volumeLabel: string | null;
};

export function priceLine(input: PriceLineInput, tier: Tier): PricedLine {
  const retail = input.retailPriceCents;
  const base = input.customerOverrideCents ?? retail;
  const tierRate = TIER_RATES[tier] ?? 0;
  const vRate = volumeRate(input.quantity);
  const tierDisc = Math.round(base * tierRate);
  const volumeDisc = Math.round((base - tierDisc) * vRate);
  const yourUnit = Math.max(0, base - tierDisc - volumeDisc);
  return {
    productId: input.productId,
    quantity: input.quantity,
    retailUnitCents: retail,
    baseUnitCents: base,
    tierDiscountUnitCents: tierDisc,
    volumeDiscountUnitCents: volumeDisc,
    yourUnitCents: yourUnit,
    lineRetailCents: retail * input.quantity,
    lineYourCents: yourUnit * input.quantity,
    lineSavingsCents: (retail - yourUnit) * input.quantity,
    volumeLabel: volumeLabel(input.quantity),
  };
}

export type CartPricing = {
  lines: PricedLine[];
  retailSubtotalCents: number;     // sum of retail prices (no discounts)
  tierDiscountCents: number;       // total tier savings
  volumeDiscountCents: number;     // total volume savings
  subtotalAfterDiscountsCents: number; // post tier+volume, pre-promo
  promoDiscountCents: number;
  promoCode: string | null;
  freeShipping: boolean;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

export function priceCart(args: {
  lines: PriceLineInput[];
  tier: Tier;
  promo?: PromoInput | null;
  shippingCents: number;
  taxRate: number; // e.g. 0.0725
}): CartPricing {
  const priced = args.lines.map((l) => priceLine(l, args.tier));
  const retailSubtotalCents = priced.reduce((s, l) => s + l.lineRetailCents, 0);
  const tierDiscountCents = priced.reduce((s, l) => s + l.tierDiscountUnitCents * l.quantity, 0);
  const volumeDiscountCents = priced.reduce((s, l) => s + l.volumeDiscountUnitCents * l.quantity, 0);
  const subtotalAfterDiscountsCents = priced.reduce((s, l) => s + l.lineYourCents, 0);

  let promoDiscountCents = 0;
  let freeShipping = false;
  let promoCode: string | null = null;
  if (args.promo) {
    // Scope filter
    let scopedCents = subtotalAfterDiscountsCents;
    if (args.promo.scope !== "all") {
      const ids = new Set(args.promo.scopeIds);
      scopedCents = priced.reduce((s, l) => {
        const line = args.lines.find((x) => x.productId === l.productId);
        if (!line) return s;
        const match =
          (args.promo!.scope === "product" && ids.has(line.productId)) ||
          (args.promo!.scope === "category" && ids.has(line.categorySlug)) ||
          (args.promo!.scope === "brand" && ids.has(line.brandSlug));
        return match ? s + l.lineYourCents : s;
      }, 0);
    }
    const ev = evaluatePromo({
      promo: args.promo,
      subtotalCents: subtotalAfterDiscountsCents,
      scopedSubtotalCents: scopedCents,
      tier: args.tier,
    });
    if (ev.ok) {
      promoDiscountCents = ev.discountCents;
      freeShipping = ev.freeShipping;
      promoCode = args.promo.code;
    }
  }

  const shippingCents = freeShipping ? 0 : args.shippingCents;
  const subAfterPromo = Math.max(0, subtotalAfterDiscountsCents - promoDiscountCents);
  const taxCents = Math.round(subAfterPromo * args.taxRate);
  const totalCents = subAfterPromo + shippingCents + taxCents;

  return {
    lines: priced,
    retailSubtotalCents,
    tierDiscountCents,
    volumeDiscountCents,
    subtotalAfterDiscountsCents,
    promoDiscountCents,
    promoCode,
    freeShipping,
    shippingCents,
    taxCents,
    totalCents,
  };
}

// ---- shipping default ------------------------------------------------------

// Free shipping over $500 (matches existing cart behavior).
export function defaultShippingCents(subtotalCents: number) {
  return subtotalCents >= 50000 ? 0 : 1499;
}

export const DEFAULT_TAX_RATE = 0.0725;
