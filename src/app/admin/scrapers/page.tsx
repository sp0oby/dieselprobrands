import { desc, eq, sql } from "drizzle-orm";
import { Play, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, scrapeRuns, products } from "@/db";
import { SCRAPERS } from "@/lib/scraping/pipeline";
import { runScraperNow } from "@/app/actions/scrapers";

export default async function AdminScrapers() {
  const recent = await db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.startedAt)).limit(20);

  // Aggregate: latest run + product count per source
  const stats = await db
    .select({
      source: products.source,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .where(sql`${products.source} is not null`)
    .groupBy(products.source);
  const countBySource = new Map(stats.map((s) => [String(s.source), Number(s.count)]));

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Scrapers</h1>
      <p className="mt-2 text-ink-muted">Pull product catalogs from supplier sites. Wires into the unified pipeline that upserts products + OEM cross-reference numbers.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Object.values(SCRAPERS).map((s) => {
          const lastRun = recent.find((r) => r.source === s.source);
          return (
            <div key={s.source} className="card-surface p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-ink">{s.label}</h3>
                {lastRun
                  ? <Badge variant={lastRun.status === "ok" ? "success" : lastRun.status === "error" ? "outline" : "warning"}>{lastRun.status}</Badge>
                  : <Badge variant="outline">never run</Badge>}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{s.description}</p>
              <p className="mt-3 text-2xl font-extrabold text-brand-400">
                {countBySource.get(s.source) ?? 0} <span className="text-xs font-normal text-ink-muted">products in catalog</span>
              </p>
              {lastRun && (
                <p className="mt-1 text-[11px] text-ink-dim">
                  Last run {new Date(lastRun.startedAt).toLocaleString()} — fetched {lastRun.fetched}, imported {lastRun.imported}, skipped {lastRun.skipped}
                  {lastRun.durationMs ? ` (${(lastRun.durationMs / 1000).toFixed(1)}s)` : ""}
                </p>
              )}
              <form action={runScraperNow} className="mt-4">
                <input type="hidden" name="source" value={s.source} />
                <Button type="submit" size="sm" className="w-full"><Play className="size-3" /> Run now</Button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="card-surface mt-8 p-6">
        <h2 className="text-lg font-bold text-ink">Recent runs</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No scraper runs yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="py-2 text-left">Source</th>
                <th className="py-2 text-left">Started</th>
                <th className="py-2 text-right">Fetched</th>
                <th className="py-2 text-right">Imported</th>
                <th className="py-2 text-right">Skipped</th>
                <th className="py-2 text-right">Duration</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 capitalize text-ink">{r.source}</td>
                  <td className="py-2 text-ink-muted">{new Date(r.startedAt).toLocaleString()}</td>
                  <td className="py-2 text-right text-ink">{r.fetched}</td>
                  <td className="py-2 text-right text-emerald-700">{r.imported}</td>
                  <td className="py-2 text-right text-amber-700">{r.skipped}</td>
                  <td className="py-2 text-right text-ink-muted">{r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "—"}</td>
                  <td className="py-2 text-right">
                    <Badge variant={r.status === "ok" ? "success" : r.status === "error" ? "outline" : "warning"} title={r.error ?? ""}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card-surface mt-8 p-6">
        <h2 className="text-lg font-bold text-ink">Apify configuration</h2>
        <p className="mt-1 text-sm text-ink-muted">FridayParts and Tamerx use the Apify actors at <a href="https://console.apify.com" target="_blank" rel="noreferrer" className="text-brand-400 inline-flex items-center gap-1">console.apify.com <ExternalLink className="size-3" /></a>. Add these env vars:</p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-black/10 bg-bg-panel/90 p-3 text-xs text-ink-muted">
{`APIFY_TOKEN=apify_api_...
APIFY_FRIDAYPARTS_DATASET_ID=         # latest dataset id from the FridayParts actor
APIFY_TAMERX_DATASET_ID=              # latest dataset id from the Tamerx actor
CRON_SECRET=                          # protects /api/cron/scraper-sync`}
        </pre>
      </div>
    </div>
  );
}
