import { eq } from "drizzle-orm";
import { Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, profiles } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/account";
import { EmailChangeForm, PasswordChangeForm } from "@/components/site/account-security-forms";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Settings</h2>
        <p className="mt-1 text-sm text-ink-muted">Update your profile, email, and password.</p>
      </div>

      <div className="card-surface p-6">
        <h3 className="text-base font-bold text-ink">Profile</h3>
        <p className="mt-1 text-xs text-ink-muted">How your name and company appear on orders and invoices.</p>
        <form action={updateProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" full><Input name="fullName" required defaultValue={profile?.fullName ?? ""} /></Field>
          <Field label="Phone"><Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} /></Field>
          <Field label="Company"><Input name="companyName" defaultValue={profile?.companyName ?? ""} /></Field>
          <div className="sm:col-span-2"><Button type="submit">Save Changes</Button></div>
        </form>
      </div>

      <div className="card-surface p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink">
          <Mail className="size-4 text-brand-400" /> Change email
        </h3>
        <p className="mt-1 text-xs text-ink-muted">We'll send a confirmation link to your new address — the change isn't final until you click it.</p>
        <div className="mt-4"><EmailChangeForm currentEmail={user.email!} /></div>
      </div>

      <div className="card-surface p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink">
          <KeyRound className="size-4 text-brand-400" /> Change password
        </h3>
        <p className="mt-1 text-xs text-ink-muted">Use at least 8 characters. You'll stay signed in on this device after updating.</p>
        <div className="mt-4"><PasswordChangeForm /></div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
