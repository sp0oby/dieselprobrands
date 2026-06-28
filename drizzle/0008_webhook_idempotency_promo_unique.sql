-- Webhook idempotency: dedupe by provider event id.
CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
  "id" text PRIMARY KEY,
  "provider" text NOT NULL,
  "event_type" text NOT NULL,
  "received_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "processed_webhook_events" ENABLE ROW LEVEL SECURITY;

-- Promo redemption uniqueness: prevents the same order from being recorded twice
-- if a Stripe webhook is replayed before the idempotency check lands. Belt + suspenders.
CREATE UNIQUE INDEX IF NOT EXISTS "promo_redemptions_promo_order_unique"
  ON "promo_redemptions" ("promo_id", "order_id");

-- Review helpful-vote dedupe: one vote per user per review.
CREATE TABLE IF NOT EXISTS "review_votes" (
  "review_id" uuid NOT NULL REFERENCES "product_reviews"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "voted_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("review_id", "user_id")
);

ALTER TABLE "review_votes" ENABLE ROW LEVEL SECURITY;
