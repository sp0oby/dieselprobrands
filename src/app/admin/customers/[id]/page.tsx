import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, profiles, orders, businessApplications, customerPriceOverrides, products, tierValues } from "@/db";
import { formatPrice } from "@/lib/utils";
import { overrideTier } from "@/app/actions/business-application";
import { setCustomerOverride, removeCustomerOverride } from "@/app/actions/promo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assertAdmin } from "@/lib/admin";

async function setTierAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id"));
  const tier = String(formData.get("tier")) as (typeof tierValues)[number];
  await overrideTier(id, tier);
}

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!profile) notFound();

  const customerOrders = await db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt));
  const apps = await db
    .select()
    .from(businessApplications)
    .where(eq(businessApplications.userId, id))
    .orderBy(desc(businessApplications.createdAt));
  const overrides = await db
    .select({
      productId: customerPriceOverrides.productId,
      priceCents: customerPriceOverrides.priceCents,
      note: customerPriceOverrides.note,
      sku: products.sku,
      name: products.name,
      retailCents: products.priceCents,
    })
    .from(customerPriceOverrides)
    .innerJoin(products, eq(products.id, customerPriceOverrides.productId))
    .where(eq(customerPriceOverrides.userId, id));

  return (
    <div>
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to customers
      </Link>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">{profile.fullName ?? profile.email}</h1>
          <p className="text-ink-muted">{profile.email}{profile.companyName ? ` · ${profile.companyName}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={profile.customerType === "business" ? "info" : "outline"}>{profile.customerType}</Badge>
          <Badge variant="brand" className="capitalize">{profile.tier}</Badge>
        </div>
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">Override tier</h2>
        <form action={setTierAction} className="mt-3 flex gap-2">
          <input type="hidden" name="id" value={profile.id} />
          <select name="tier" defaultValue={profile.tier} className="h-10 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink capitalize">
            {tierValues.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button type="submit">Set</Button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">Skips the application workflow; applies immediately.</p>
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">Business Applications</h2>
        {apps.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No applications submitted.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm">
                <div>
                  <p className="text-ink">{a.companyName} <span className="text-ink-muted">· {a.industry} · requested {a.requestedTier}</span></p>
                  <p className="text-xs text-ink-muted">Submitted {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={a.status === "approved" ? "success" : a.status === "rejected" ? "outline" : "warning"}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">Negotiated Price Overrides</h2>
        <p className="mt-1 text-sm text-ink-muted">Set a fixed per-unit price (overrides retail and tier discount; volume still applies).</p>
        <form action={setCustomerOverride} className="mt-4 grid gap-3 sm:grid-cols-[1fr,140px,1fr,auto]">
          <input type="hidden" name="userId" value={profile.id} />
          <div className="space-y-1"><Label className="text-xs">Product SKU</Label><Input name="sku" placeholder="GT3782VA" required /></div>
          <div className="space-y-1"><Label className="text-xs">Unit price (USD)</Label><Input name="price" type="number" step="0.01" required /></div>
          <div className="space-y-1"><Label className="text-xs">Note</Label><Input name="note" placeholder="Contract #..." /></div>
          <div className="self-end"><Button type="submit" className="w-full sm:w-auto">Save</Button></div>
        </form>
        {overrides.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No overrides configured.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {overrides.map((o) => (
              <li key={o.productId} className="grid grid-cols-[1fr,auto,auto,auto] items-center gap-3 rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink">{o.name}</p>
                  <p className="font-mono text-xs text-ink-dim">{o.sku}{o.note ? ` · ${o.note}` : ""}</p>
                </div>
                <span className="text-xs text-ink-muted line-through">{formatPrice(o.retailCents)}</span>
                <span className="text-sm font-semibold text-ink">{formatPrice(o.priceCents)}</span>
                <form action={removeCustomerOverride}>
                  <input type="hidden" name="userId" value={profile.id} />
                  <input type="hidden" name="productId" value={o.productId} />
                  <Button type="submit" variant="outline" size="sm">Remove</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">Orders</h2>
        {customerOrders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No orders yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {customerOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm">
                <Link href={`/orders/${o.id}`} className="font-mono text-ink hover:text-brand-400">
                  DPB-{String(o.number).padStart(6, "0")}
                </Link>
                <Badge variant={o.status === "delivered" ? "success" : "warning"}>{o.status}</Badge>
                <span className="text-ink">{formatPrice(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
