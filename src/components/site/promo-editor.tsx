"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { promoCodes } from "@/db";

type Promo = typeof promoCodes.$inferSelect;

const KINDS = [
  { value: "percent", label: "Percent off" },
  { value: "fixed", label: "Fixed $ off" },
  { value: "free_shipping", label: "Free shipping" },
];

const SCOPES = [
  { value: "all", label: "All products" },
  { value: "category", label: "Category (slugs in scope IDs)" },
  { value: "brand", label: "Brand (slugs in scope IDs)" },
  { value: "product", label: "Specific products (UUIDs in scope IDs)" },
];

const TIERS = ["retail", "dealer", "wholesale", "vip"];

export function PromoEditor({
  promo,
  action,
}: {
  promo?: Promo;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="card-surface mt-6 grid gap-4 p-6 lg:grid-cols-2">
      {promo && <input type="hidden" name="id" value={promo.id} />}

      <Field label="Code *" full><Input name="code" required defaultValue={promo?.code} className="font-mono uppercase" /></Field>
      <Field label="Description" full><Input name="description" defaultValue={promo?.description ?? ""} placeholder="Internal note shown to admins" /></Field>

      <Field label="Kind *">
        <select name="kind" defaultValue={promo?.kind ?? "percent"} className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </Field>
      <Field label="Value (% or USD) *">
        <Input
          name="value"
          type="number"
          step="0.01"
          required
          defaultValue={promo ? (promo.kind === "fixed" ? (promo.value / 100).toFixed(2) : String(promo.value)) : ""}
        />
      </Field>
      <Field label="Min subtotal (USD)">
        <Input name="minSubtotal" type="number" step="0.01" defaultValue={promo ? (promo.minSubtotalCents / 100).toFixed(2) : "0"} />
      </Field>
      <Field label="Max discount cap (USD, optional)">
        <Input name="maxDiscount" type="number" step="0.01" defaultValue={promo?.maxDiscountCents ? (promo.maxDiscountCents / 100).toFixed(2) : ""} />
      </Field>

      <Field label="Max total uses (blank = unlimited)"><Input name="maxUses" type="number" min="1" defaultValue={promo?.maxUses ?? ""} /></Field>
      <Field label="Max uses per customer"><Input name="perCustomerUses" type="number" min="1" defaultValue={promo?.perCustomerUses ?? ""} /></Field>

      <Field label="Scope">
        <select name="scope" defaultValue={promo?.scope ?? "all"} className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
          {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Scope IDs (comma-separated)">
        <Input name="scopeIds" defaultValue={promo?.scopeIds?.join(", ") ?? ""} placeholder="turbochargers, fuel-pumps" />
      </Field>

      <Field label="Starts at"><Input name="startsAt" type="datetime-local" defaultValue={promo?.startsAt ? toLocal(promo.startsAt) : ""} /></Field>
      <Field label="Expires at"><Input name="expiresAt" type="datetime-local" defaultValue={promo?.expiresAt ? toLocal(promo.expiresAt) : ""} /></Field>

      <Field label="Allowed tiers (leave empty for all)" full>
        <div className="flex flex-wrap gap-3 pt-1">
          {TIERS.map((t) => (
            <label key={t} className="inline-flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="allowedTiers" value={t} defaultChecked={promo?.allowedTiers?.includes(t)} className="size-4 rounded border-black/15 bg-bg-panel" />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </Field>

      <div className="lg:col-span-2 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="active" defaultChecked={promo?.active ?? true} className="size-4 rounded border-black/15 bg-bg-panel" /> Active
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="stackable" defaultChecked={promo?.stackable ?? false} className="size-4 rounded border-black/15 bg-bg-panel" /> Stackable with tier + volume
        </label>
      </div>

      <div className="lg:col-span-2"><Button type="submit" size="lg">{promo ? "Save Changes" : "Create Code"}</Button></div>
    </form>
  );
}

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-2 ${full ? "lg:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
