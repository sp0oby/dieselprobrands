import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Truck } from "lucide-react";
import { desc, eq, count, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, syncLog, warehouses, products, profiles, orders } from "@/db";
import { isZohoConfigured } from "@/lib/zoho/client";
import { syncWarehousesNow, syncItemsNow } from "@/app/actions/zoho";

async function syncWarehousesAction() { "use server"; await syncWarehousesNow(); }
async function syncItemsAction() { "use server"; await syncItemsNow(); }

export default async function AdminIntegrations() {
  const configured = isZohoConfigured();

  const [recentLogs, whCount, syncedProducts, syncedProfiles, syncedOrders] = await Promise.all([
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(20),
    db.select({ c: count() }).from(warehouses),
    db.select({ c: count() }).from(products).where(sql`${products.zohoItemId} is not null`),
    db.select({ c: count() }).from(profiles).where(sql`${profiles.zohoContactId} is not null`),
    db.select({ c: count() }).from(orders).where(sql`${orders.zohoSalesOrderId} is not null`),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Integrations</h1>
      <p className="mt-2 text-ink-muted">External services connected to DieselPro Brands.</p>

      {!configured && (
        <div className="card-surface mt-6 p-6 border-amber-500/30 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">Zoho not yet configured</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Add the following environment variables to enable Zoho CRM + Inventory + Books sync.
                All Zoho-bound operations no-op silently until configured.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-md border border-black/10 bg-bg-panel/90 p-3 text-xs text-ink-muted">
{`ZOHO_CLIENT_ID=1000.xxxxx
ZOHO_CLIENT_SECRET=xxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxx
ZOHO_DATA_CENTER=com           # com | eu | in | com.au | jp
ZOHO_ORG_ID=12345678           # Inventory + Books org id
CRON_SECRET=                   # optional, protects /api/cron/zoho-sync`}
              </pre>
              <p className="mt-3 text-xs text-ink-muted">
                Create the OAuth client and refresh token at{" "}
                <a href="https://api-console.zoho.com" target="_blank" rel="noreferrer" className="text-brand-400 inline-flex items-center gap-1">
                  api-console.zoho.com <ExternalLink className="size-3" />
                </a>{" "}
                with scopes <code className="font-mono">ZohoCRM.modules.contacts.ALL ZohoInventory.FullAccess.all ZohoBooks.fullaccess.all</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ServiceCard
          name="Zoho CRM"
          configured={configured}
          stat={`${syncedProfiles[0].c} contacts synced`}
          syncedNote="Profiles → Contacts on signup, business approval, tier change."
        />
        <ServiceCard
          name="Zoho Inventory"
          configured={configured}
          stat={`${whCount[0].c} warehouses, ${syncedProducts[0].c} items linked`}
          syncedNote="Pulls stock + warehouses; pushes Sales Orders on paid checkout."
          actions={
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={syncWarehousesAction}><Button size="sm" type="submit" disabled={!configured}><RefreshCw className="size-3" /> Sync warehouses</Button></form>
              <form action={syncItemsAction}><Button size="sm" type="submit" disabled={!configured} variant="outline"><Truck className="size-3" /> Sync items</Button></form>
            </div>
          }
        />
        <ServiceCard
          name="Zoho Books"
          configured={configured}
          stat={`${syncedOrders[0].c} orders invoiced`}
          syncedNote="Invoices auto-generated on Sales Order creation. (Sprint 5)"
        />
      </div>

      <div className="card-surface mt-8 p-6">
        <h2 className="text-lg font-bold text-ink">Recent Sync Activity</h2>
        {recentLogs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No sync activity yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="py-2 text-left">When</th>
                <th className="py-2 text-left">Service</th>
                <th className="py-2 text-left">Operation</th>
                <th className="py-2 text-right">Records</th>
                <th className="py-2 text-right">Duration</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {recentLogs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 text-ink-muted">{new Date(l.startedAt).toLocaleString()}</td>
                  <td className="py-2 text-ink capitalize">{l.service}</td>
                  <td className="py-2 text-ink-muted font-mono text-xs">{l.operation}</td>
                  <td className="py-2 text-right text-ink">{l.recordsAffected}</td>
                  <td className="py-2 text-right text-ink-muted">{l.durationMs ? `${l.durationMs}ms` : "—"}</td>
                  <td className="py-2 text-right">
                    {l.status === "ok"
                      ? <Badge variant="success">ok</Badge>
                      : <Badge variant="outline" title={l.error ?? ""}>error</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ServiceCard({
  name, configured, stat, syncedNote, actions,
}: {
  name: string;
  configured: boolean;
  stat: string;
  syncedNote: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-bold text-ink">{name}</h3>
        {configured ? (
          <Badge variant="success"><CheckCircle2 className="mr-1 size-3" /> ready</Badge>
        ) : (
          <Badge variant="outline">not configured</Badge>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-brand-400">{stat}</p>
      <p className="mt-1 text-xs text-ink-muted">{syncedNote}</p>
      {actions}
    </div>
  );
}
