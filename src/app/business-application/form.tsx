"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitBusinessApplication } from "@/app/actions/business-application";

const INDUSTRIES = ["Agricultural", "Highway / Trucking", "Construction", "Marine", "Industrial / Generators", "Other"];
const TIERS = [
  { value: "dealer", label: "Dealer (10–18% off)" },
  { value: "wholesale", label: "Wholesale (18–25% off)" },
  { value: "vip", label: "VIP / Strategic" },
];

export function BusinessApplicationForm({ defaultName = "" }: { defaultName?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        start(async () => {
          const res = await submitBusinessApplication(data);
          if (!res.ok) setError(res.error);
          else router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name *"><Input name="companyName" defaultValue={defaultName} required /></Field>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
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
