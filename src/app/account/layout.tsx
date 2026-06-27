import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { db, profiles } from "@/db";
import { SignOutButton } from "@/components/site/sign-out-button";
import { AccountNav } from "@/components/site/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const fullName = profile?.fullName ?? (user.user_metadata?.full_name as string) ?? user.email!.split("@")[0];
  const initials = fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const tier = profile?.tier ?? "retail";
  const customerType = profile?.customerType ?? "retail";

  return (
    <div className="container-x py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-ink">My Account</h1>
          <p className="mt-2 text-ink-muted">Manage your profile, orders, and preferences</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-2">
          <div className="card-surface p-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant={customerType === "business" ? "info" : "outline"}>{customerType}</Badge>
                <Badge variant="brand" className="capitalize">{tier}</Badge>
              </div>
            </div>
          </div>
          <AccountNav />
          {customerType === "retail" && (
            <Link href="/business-application" className="block card-surface p-4 text-center text-sm transition-colors hover:border-brand/40">
              <p className="font-semibold text-brand-400">Upgrade to Business</p>
              <p className="mt-1 text-xs text-ink-muted">Unlock dealer pricing & net terms.</p>
            </Link>
          )}
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
