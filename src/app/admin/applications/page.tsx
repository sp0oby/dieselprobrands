import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, businessApplications, profiles, tierValues } from "@/db";
import { approveApplication, rejectApplication } from "@/app/actions/business-application";

async function approveAction(formData: FormData) {
  "use server";
  await approveApplication(
    String(formData.get("id")),
    String(formData.get("tier")) as (typeof tierValues)[number],
    String(formData.get("note") || "") || undefined,
  );
}
async function rejectAction(formData: FormData) {
  "use server";
  await rejectApplication(String(formData.get("id")), String(formData.get("note") || "") || undefined);
}

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const rows = await db
    .select({
      app: businessApplications,
      email: profiles.email,
      fullName: profiles.fullName,
    })
    .from(businessApplications)
    .leftJoin(profiles, eq(profiles.id, businessApplications.userId))
    .where(eq(businessApplications.status, status as "pending" | "approved" | "rejected"))
    .orderBy(desc(businessApplications.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Business Applications</h1>

      <div className="mt-4 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link
            key={s}
            href={s === "pending" ? "/admin/applications" : `/admin/applications?status=${s}`}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize ${status === s ? "border-brand bg-brand text-white" : "border-black/10 text-ink-muted hover:text-ink"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 && (
          <p className="card-surface p-12 text-center text-ink-muted">No {status} applications.</p>
        )}
        {rows.map(({ app, email, fullName }) => (
          <div key={app.id} className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">{app.companyName}</h2>
                <p className="text-sm text-ink-muted">{fullName ?? email} <span className="text-ink-dim">· {email}</span></p>
                <p className="mt-1 text-xs text-ink-dim">Submitted {new Date(app.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant={app.status === "approved" ? "success" : app.status === "rejected" ? "outline" : "warning"}>{app.status}</Badge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm sm:grid-cols-4">
              <DL k="Industry" v={app.industry} />
              <DL k="Tax ID" v={app.taxId} />
              <DL k="Requested" v={app.requestedTier} />
              <DL k="Volume" v={app.monthlyVolumeUsd ? `$${app.monthlyVolumeUsd.toLocaleString()}/mo` : "—"} />
              {app.websiteUrl && <DL k="Website" v={<a href={app.websiteUrl} target="_blank" rel="noreferrer" className="text-brand-400">{app.websiteUrl}</a>} />}
            </dl>

            {app.notes && (
              <div className="mt-3 rounded-md border border-black/[0.06] bg-bg-panel p-3 text-sm text-ink-muted">
                <p className="text-xs uppercase tracking-wider text-ink-dim">Customer note</p>
                <p className="mt-1">{app.notes}</p>
              </div>
            )}

            {app.status === "pending" && (
              <div className="mt-5 grid gap-2 sm:grid-cols-[1fr,1fr,auto,auto]">
                <select name="tier" form={`approve-${app.id}`} defaultValue={app.requestedTier} className="h-10 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink capitalize">
                  {tierValues.filter((t) => t !== "retail").map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input form={`approve-${app.id}`} name="note" placeholder="Internal note (optional)" className="h-10 rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink" />
                <form id={`approve-${app.id}`} action={approveAction}>
                  <input type="hidden" name="id" value={app.id} />
                  <Button type="submit" className="w-full"><Check className="size-4" /> Approve</Button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={app.id} />
                  <Button type="submit" variant="outline" className="w-full"><X className="size-4" /> Reject</Button>
                </form>
              </div>
            )}

            {app.status !== "pending" && app.reviewerNote && (
              <p className="mt-3 text-xs text-ink-muted">Reviewer note: "{app.reviewerNote}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DL({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-ink-dim">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
