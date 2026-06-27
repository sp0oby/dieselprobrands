"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const INDUSTRIES = ["Agricultural", "Highway / Trucking", "Construction", "Marine", "Industrial / Generators", "Other"];
const TIERS = [
  { value: "dealer", label: "Dealer (10–18% off)" },
  { value: "wholesale", label: "Wholesale (18–25% off)" },
  { value: "vip", label: "VIP / Strategic" },
];

export function BusinessSignupForm({ next }: { next: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-200">
        Application received! Check your email to confirm your account. Once confirmed, you can shop with retail
        pricing while our team reviews your business application (1–2 business days).
      </p>
    );
  }

  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
        start(async () => {
          const supabase = createClient();
          const { error: signErr, data: signData } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
                customer_type: "business",
                company_name: data.companyName,
                phone: data.phone,
              },
              emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}&app=1`,
            },
          });
          if (signErr) { setError(signErr.message); return; }
          // Store the application payload in localStorage; the auth callback consumes + inserts on confirmation.
          try {
            const payload = {
              companyName: data.companyName,
              taxId: data.taxId,
              industry: data.industry,
              websiteUrl: data.websiteUrl,
              monthlyVolumeUsd: Number(data.monthlyVolumeUsd) || 0,
              requestedTier: data.requestedTier,
              notes: data.notes,
            };
            sessionStorage.setItem("dpb_pending_app", JSON.stringify(payload));
          } catch {}
          setSent(true);
        });
      }}
    >
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-ink-muted uppercase tracking-wider">Account</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *"><Input name="fullName" required /></Field>
          <Field label="Email *"><Input name="email" type="email" required /></Field>
          <Field label="Phone"><Input name="phone" type="tel" /></Field>
          <Field label="Password (min 8) *"><Input name="password" type="password" minLength={8} required /></Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-ink-muted uppercase tracking-wider">Business</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name *"><Input name="companyName" required /></Field>
          <Field label="EIN / Tax ID *"><Input name="taxId" required /></Field>
          <Field label="Industry *">
            <select name="industry" required className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Website"><Input name="websiteUrl" type="url" placeholder="https://" /></Field>
          <Field label="Estimated monthly volume (USD)"><Input name="monthlyVolumeUsd" type="number" min="0" /></Field>
          <Field label="Requested tier *">
            <select name="requestedTier" required defaultValue="dealer" className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
              {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Anything else we should know?"><Textarea name="notes" rows={3} /></Field>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
