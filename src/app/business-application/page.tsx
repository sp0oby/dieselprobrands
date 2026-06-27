import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { db, businessApplications, profiles } from "@/db";
import { BusinessApplicationForm } from "./form";

export default async function BusinessApplicationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/business-application");

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const apps = await db
    .select()
    .from(businessApplications)
    .where(eq(businessApplications.userId, user.id))
    .orderBy(desc(businessApplications.createdAt));

  const latest = apps[0];

  // Already approved? Show the result, not the form.
  if (profile?.customerType === "business" && profile?.tier !== "retail") {
    return (
      <div className="container-x py-16">
        <div className="card-surface mx-auto max-w-xl p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <h1 className="mt-4 text-3xl font-bold text-ink">You're approved</h1>
          <p className="mt-2 text-ink-muted">
            Your account is set as <Badge variant="brand">{profile.tier}</Badge> with business pricing applied at checkout.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link href="/shop">Browse parts</Link></Button>
            <Button asChild variant="outline"><Link href="/account">Account</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (latest?.status === "pending") {
    return (
      <div className="container-x py-16">
        <div className="card-surface mx-auto max-w-xl p-8">
          <Clock className="mx-auto size-10 text-amber-600" />
          <h1 className="mt-4 text-center text-2xl font-bold text-ink">Application under review</h1>
          <p className="mt-2 text-center text-sm text-ink-muted">
            Submitted {new Date(latest.createdAt).toLocaleDateString()}. We typically respond within 1–2 business days.
            You can shop with retail pricing in the meantime.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-ink-muted">Company</dt><dd className="text-right text-ink">{latest.companyName}</dd>
            <dt className="text-ink-muted">Industry</dt><dd className="text-right text-ink">{latest.industry}</dd>
            <dt className="text-ink-muted">Requested tier</dt><dd className="text-right text-ink capitalize">{latest.requestedTier}</dd>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-16">
      <div className="card-surface mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-bold text-ink">Apply for a business account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Unlock dealer/wholesale pricing, volume discounts, and net-terms payment on approval.
        </p>

        {latest?.status === "rejected" && (
          <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 flex gap-2">
            <XCircle className="size-4 mt-0.5 shrink-0" />
            <div>
              <p>Your previous application was not approved.</p>
              {latest.reviewerNote && <p className="mt-1 text-red-100/80">"{latest.reviewerNote}"</p>}
              <p className="mt-1 text-red-100/80">You may submit a new application below.</p>
            </div>
          </div>
        )}

        <BusinessApplicationForm
          defaultName={profile?.companyName ?? ""}
        />
      </div>
    </div>
  );
}
