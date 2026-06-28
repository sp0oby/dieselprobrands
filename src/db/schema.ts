import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  serial,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---- catalog ----------------------------------------------------------------

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  productCount: integer("product_count").notNull().default(0),
});

export const brands = pgTable("brands", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull().default(""),
  category: text("category").notNull(),
  country: text("country").notNull(),
  founded: integer("founded").notNull(),
  description: text("description").notNull(),
  productCount: integer("product_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: text("sku").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brandSlug: text("brand_slug").notNull().references(() => brands.slug),
  categorySlug: text("category_slug").notNull().references(() => categories.slug),
  priceCents: integer("price_cents").notNull(),
  originalPriceCents: integer("original_price_cents"),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
  reviewCount: integer("review_count").notNull().default(0),
  badge: text("badge"), // BEST SELLER | PRO GRADE | NEW | HOT DEAL | null
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
  inStock: boolean("in_stock").notNull().default(true),
  stockQty: integer("stock_qty").notNull().default(0),
  imageUrl: text("image_url"),
  zohoItemId: text("zoho_item_id"),
  source: text("source"), // "fabheavy" | "fridayparts" | "tamerx" | "manual"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- OEM / replacement part number cross-reference -------------------------
// Index every replacement part number a product covers, so searching the
// competitor's part number returns our equivalent.

export const oemPartNumbers = pgTable(
  "oem_part_numbers",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    partNumber: text("part_number").notNull(), // lowercased + alphanumeric-only for matching
    rawNumber: text("raw_number").notNull(),    // original casing/punctuation for display
    source: text("source"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.productId, t.partNumber] }) }),
);

// ---- scrape audit ---------------------------------------------------------

export const scrapeRuns = pgTable("scrape_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),     // "fabheavy" | "fridayparts" | "tamerx"
  status: text("status").notNull(),     // "running" | "ok" | "error"
  fetched: integer("fetched").notNull().default(0),
  imported: integer("imported").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  durationMs: integer("duration_ms"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

// ---- Zoho integration -------------------------------------------------------

// Single-row table keyed by service id (e.g. "crm", "inventory", "books").
// Stores OAuth access + refresh tokens that the client refreshes lazily.
export const zohoTokens = pgTable("zoho_tokens", {
  service: text("service").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  dataCenter: text("data_center").notNull().default("com"),
  apiDomain: text("api_domain"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Audit trail for sync runs (manual or cron).
export const syncLog = pgTable("sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  service: text("service").notNull(),
  operation: text("operation").notNull(), // "pull_items" | "push_contact" | "push_order" | ...
  status: text("status").notNull(),       // "ok" | "error"
  recordsAffected: integer("records_affected").notNull().default(0),
  error: text("error"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

// Warehouses (synced from Zoho Inventory).
export const warehouses = pgTable("warehouses", {
  id: text("id").primaryKey(),          // Zoho warehouse_id
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  active: boolean("active").notNull().default(true),
  isPrimary: boolean("is_primary").notNull().default(false),
});

// Per-warehouse stock per product (synced from Zoho).
export const productStock = pgTable(
  "product_stock",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.productId, t.warehouseId] }) }),
);

// ---- accounts (mirrors auth.users) ------------------------------------------

export const customerTypeValues = ["retail", "business"] as const;
export type CustomerType = (typeof customerTypeValues)[number];

// Pricing tiers — drives the pricing engine in Sprint 3.
export const tierValues = ["retail", "dealer", "wholesale", "vip"] as const;
export type Tier = (typeof tierValues)[number];

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  customerType: text("customer_type").$type<CustomerType>().notNull().default("retail"),
  tier: text("tier").$type<Tier>().notNull().default("retail"),
  companyName: text("company_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  zohoContactId: text("zoho_contact_id"),
  zohoSyncedAt: timestamp("zoho_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- business application workflow ------------------------------------------

export const applicationStatusValues = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof applicationStatusValues)[number];

export const businessApplications = pgTable("business_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  status: text("status").$type<ApplicationStatus>().notNull().default("pending"),
  // Submitted details
  companyName: text("company_name").notNull(),
  taxId: text("tax_id").notNull(),       // EIN/VAT
  industry: text("industry").notNull(),  // e.g. agricultural, marine, construction, highway, other
  websiteUrl: text("website_url"),
  monthlyVolumeUsd: integer("monthly_volume_usd"),
  requestedTier: text("requested_tier").$type<Tier>().notNull().default("dealer"),
  notes: text("notes"),
  // Review trail
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerNote: text("reviewer_note"),
  approvedTier: text("approved_tier").$type<Tier>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  country: text("country").notNull().default("US"),
  isDefault: boolean("is_default").notNull().default(false),
});

// ---- shipping methods ------------------------------------------------------

export const shippingMethods = pgTable("shipping_methods", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  baseCents: integer("base_cents").notNull(),         // flat base fee
  perItemCents: integer("per_item_cents").notNull().default(0), // extra per unit
  freeShippingMinCents: integer("free_shipping_min_cents"),     // free over $X (null = never free)
  etaDays: text("eta_days").notNull(),                // "3-5 business days"
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---- product reviews -------------------------------------------------------

export const reviewStatusValues = ["pending", "published", "rejected"] as const;
export type ReviewStatus = (typeof reviewStatusValues)[number];

export const productReviews = pgTable("product_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  status: text("status").$type<ReviewStatus>().notNull().default("pending"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- webhook idempotency ---------------------------------------------------

// Stripe (and other providers) retry webhooks on transient failures. Recording
// the event id with a unique constraint lets the handler reject duplicates
// before doing any side-effects (promo redemption, Zoho push, email).
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  id: text("id").primaryKey(), // provider's event id, e.g. "evt_..."
  provider: text("provider").notNull(), // "stripe" | future providers
  eventType: text("event_type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per user-per-review; the unique primary key prevents vote spam.
export const reviewVotes = pgTable(
  "review_votes",
  {
    reviewId: uuid("review_id").notNull().references(() => productReviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.reviewId, t.userId] }) }),
);

// ---- abandoned cart tracking -----------------------------------------------

export const cartAbandonmentNotifications = pgTable(
  "cart_abandonment_notifications",
  {
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    stage: text("stage").notNull(), // "4h" | "24h" | "7d"
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.cartId, t.stage] }) }),
);

// ---- returns / RMA ---------------------------------------------------------

export const returnStatusValues = [
  "pending",   // customer submitted, awaiting admin review
  "approved",  // admin approved; customer needs to ship the package
  "rejected",  // admin rejected
  "received",  // package received at warehouse, inspecting
  "refunded",  // refund issued
  "closed",    // resolved without refund (e.g. exchange)
] as const;
export type ReturnStatus = (typeof returnStatusValues)[number];

export const returnReasonValues = [
  "defective",
  "wrong_part",
  "no_longer_needed",
  "damaged_in_shipping",
  "ordered_by_mistake",
  "other",
] as const;
export type ReturnReason = (typeof returnReasonValues)[number];

export const returnItemDecisionValues = ["pending", "restock", "scrap", "missing"] as const;
export type ReturnItemDecision = (typeof returnItemDecisionValues)[number];

export const returnRequests = pgTable("return_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  rmaNumber: serial("rma_number"), // human-readable, RMA-000123
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  status: text("status").$type<ReturnStatus>().notNull().default("pending"),
  reason: text("reason").$type<ReturnReason>().notNull(),
  customerNote: text("customer_note"),
  reviewerId: uuid("reviewer_id"),
  reviewerNote: text("reviewer_note"),
  // Computed at submission time but admin can override:
  restockingFeeCents: integer("restocking_fee_cents").notNull().default(0),
  refundAmountCents: integer("refund_amount_cents").notNull().default(0),
  shippingLabelUrl: text("shipping_label_url"),
  zohoCreditNoteId: text("zoho_credit_note_id"),
  stripeRefundId: text("stripe_refund_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
});

export const returnItems = pgTable("return_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => returnRequests.id, { onDelete: "cascade" }),
  orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  decision: text("decision").$type<ReturnItemDecision>().notNull().default("pending"),
  conditionNote: text("condition_note"),
});

// ---- pricing: promos + customer overrides -----------------------------------

export const promoKindValues = ["percent", "fixed", "free_shipping"] as const;
export type PromoKind = (typeof promoKindValues)[number];

export const promoScopeValues = ["all", "category", "brand", "product"] as const;
export type PromoScope = (typeof promoScopeValues)[number];

export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // stored uppercase
  description: text("description"),
  kind: text("kind").$type<PromoKind>().notNull().default("percent"),
  value: integer("value").notNull(), // percent: 0-100, fixed: cents
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  maxDiscountCents: integer("max_discount_cents"), // cap for percent promos
  maxUses: integer("max_uses"),                      // null = unlimited
  perCustomerUses: integer("per_customer_uses"),     // null = unlimited per customer
  usesCount: integer("uses_count").notNull().default(0),
  stackable: boolean("stackable").notNull().default(false),
  scope: text("scope").$type<PromoScope>().notNull().default("all"),
  scopeIds: jsonb("scope_ids").$type<string[]>().notNull().default([]),
  // Tier restriction — if set, only these tiers can use the code.
  allowedTiers: jsonb("allowed_tiers").$type<string[]>().notNull().default([]),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promoRedemptions = pgTable("promo_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  promoId: uuid("promo_id").notNull().references(() => promoCodes.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  discountCents: integer("discount_cents").notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-customer price overrides (B2B negotiated pricing).
export const customerPriceOverrides = pgTable(
  "customer_price_overrides",
  {
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.productId] }) }),
);

// ---- wishlist --------------------------------------------------------------

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.productId] }) }),
);

// ---- cart -------------------------------------------------------------------

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // for anonymous carts
  promoCode: text("promo_code"), // currently-applied code (uppercased)
  shippingMethodSlug: text("shipping_method_slug"),
  email: text("email"), // captured for guest carts (abandoned-cart email)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull().default(1),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.cartId, t.productId] }) }),
);

// ---- orders -----------------------------------------------------------------

export const orderStatusValues = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof orderStatusValues)[number];

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: serial("number"), // human-readable
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  // Pricing breakdown captured at order time so historical orders don't shift.
  retailSubtotalCents: integer("retail_subtotal_cents").notNull().default(0),
  tierDiscountCents: integer("tier_discount_cents").notNull().default(0),
  volumeDiscountCents: integer("volume_discount_cents").notNull().default(0),
  promoDiscountCents: integer("promo_discount_cents").notNull().default(0),
  promoCode: text("promo_code"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  shippingMethodSlug: text("shipping_method_slug"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  zohoSalesOrderId: text("zoho_sales_order_id"),
  zohoInvoiceId: text("zoho_invoice_id"),
  zohoCreditNoteId: text("zoho_credit_note_id"),
  zohoSyncedAt: timestamp("zoho_synced_at", { withTimezone: true }),
  refundedCents: integer("refunded_cents").notNull().default(0),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  shippingAddress: jsonb("shipping_address").$type<{
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// ---- relations --------------------------------------------------------------

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  brand: one(brands, { fields: [products.brandSlug], references: [brands.slug] }),
  category: one(categories, { fields: [products.categorySlug], references: [categories.slug] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
