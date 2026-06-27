-- Enable Row Level Security on every public table.
-- Our app reads/writes via Drizzle on a direct Postgres connection (DATABASE_URL),
-- which connects as the postgres superuser and bypasses RLS.
-- This blocks Supabase's auto-exposed PostgREST API from leaking data to anyone
-- with the public anon/publishable key.
--
-- If we ever want to query directly from the browser via the Supabase JS client,
-- we'd add per-table policies (e.g. "users can read their own orders").

ALTER TABLE "addresses"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands"                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_applications"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_abandonment_notifications"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts"                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_price_overrides"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oem_part_numbers"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_reviews"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_stock"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promo_codes"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promo_redemptions"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "return_items"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "return_requests"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scrape_runs"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipping_methods"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_log"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "warehouses"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zoho_tokens"                     ENABLE ROW LEVEL SECURITY;

-- Public-readable tables: even though RLS is on, allow anon SELECT on the catalog
-- so a future client-side "Supabase quick search" could work without changes.
-- (We don't rely on this — Drizzle still serves everything via server components.)
CREATE POLICY "categories are publicly readable"     ON "categories"     FOR SELECT USING (true);
CREATE POLICY "brands are publicly readable"         ON "brands"         FOR SELECT USING (true);
CREATE POLICY "products are publicly readable"       ON "products"       FOR SELECT USING (true);
CREATE POLICY "shipping_methods publicly readable"   ON "shipping_methods" FOR SELECT USING (true);
CREATE POLICY "oem_part_numbers publicly readable"   ON "oem_part_numbers" FOR SELECT USING (true);
CREATE POLICY "published reviews publicly readable"  ON "product_reviews" FOR SELECT USING (status = 'published');
