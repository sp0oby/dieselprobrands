# DieselPro Brands

Production rebuild of the DieselPro Brands diesel parts marketplace, recreated from a Figma Make prototype. Full e-commerce: catalog, cart, Stripe checkout, accounts, orders, admin panel.

## Stack
- **Next.js 15** (App Router, React 19, Turbopack)
- **Supabase** — Postgres + Auth + Storage
- **Drizzle ORM** for the Postgres schema/migrations
- **Stripe Checkout** for payments
- **Tailwind CSS** with a dark `#0a0b0d` / red `#d32f2f` theme matching the Figma design
- Deploys to **Vercel** via `vercel.ts`

## Setup

```bash
# 1. install
npm install

# 2. configure env (copy and fill)
cp .env.example .env.local

# 3. push schema to your Supabase Postgres
npm run db:generate
# then apply via Supabase dashboard SQL editor, or:
npx drizzle-kit push

# 4. seed catalog (12 categories, 29 brands, 28+ products)
npm run db:seed

# 5. dev
npm run dev
```

Open http://localhost:3000.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                     # Supabase Transaction-pooler URL (port 6543)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com      # comma-separated admin emails
```

## Site map
- `/` — Home (hero, categories, hot deals, brand grid, CTA)
- `/shop` — Catalog w/ category + price + stock filters and sort
- `/shop/[slug]` — Product detail
- `/brands` — All 29 brand cards w/ category filter
- `/brands/[slug]` — Per-brand catalog
- `/about`, `/contact`, `/help`, `/careers`, `/returns-warranty`, `/privacy-policy`, `/terms-of-service`
- `/cart`, `/checkout/success` — Cart + Stripe checkout outcome
- `/sign-in`, `/sign-up` — Supabase Auth
- `/account`, `/orders` — Auth-gated
- `/admin`, `/admin/products`, `/admin/products/[id]`, `/admin/products/new`, `/admin/brands`, `/admin/orders` — gated by `ADMIN_EMAILS`

## Stripe webhook (local)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy whsec_... into STRIPE_WEBHOOK_SECRET
```

## Deploy
```bash
vercel link
vercel env pull .env.local
vercel deploy --prod
```
Install Supabase + Stripe via Vercel Marketplace and the env vars are auto-provisioned.
