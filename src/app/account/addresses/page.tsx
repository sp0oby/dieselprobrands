import { eq, desc } from "drizzle-orm";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, addresses } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { saveAddress, deleteAddress } from "@/app/actions/account";

export default async function AccountAddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Saved Addresses</h2>
        <p className="mt-1 text-sm text-ink-muted">Reuse these at checkout. Mark one as default for one-click selection.</p>
      </div>

      {rows.length === 0 ? (
        <p className="card-surface p-12 text-center text-sm text-ink-muted">
          No saved addresses yet. Add one below or save one at checkout.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((a) => (
            <li key={a.id} className="card-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-brand-400" />
                  <span className="text-sm font-semibold text-ink">{a.label}</span>
                  {a.isDefault && <Badge variant="brand"><Star className="mr-1 size-3" /> Default</Badge>}
                </div>
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="ghost" size="icon" aria-label="Delete">
                    <Trash2 className="size-4 text-ink-muted hover:text-brand-400" />
                  </Button>
                </form>
              </div>
              <address className="mt-3 not-italic text-sm text-ink-muted leading-relaxed">
                {a.line1}<br />
                {a.line2 && <>{a.line2}<br /></>}
                {a.city}, {a.state} {a.zip}<br />
                {a.country}
              </address>
            </li>
          ))}
        </ul>
      )}

      <div className="card-surface p-6">
        <h3 className="text-base font-bold text-ink flex items-center gap-2"><Plus className="size-4" /> Add a new address</h3>
        <form action={saveAddress} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Label *" full><Input name="label" required placeholder="Home, Shop, Warehouse..." /></Field>
          <Field label="Street address *" full><Input name="line1" required /></Field>
          <Field label="Apt / Suite / Unit" full><Input name="line2" /></Field>
          <Field label="City *"><Input name="city" required /></Field>
          <Field label="State *"><Input name="state" required maxLength={2} placeholder="FL" /></Field>
          <Field label="ZIP *"><Input name="zip" required maxLength={10} /></Field>
          <Field label="Country"><Input name="country" defaultValue="US" maxLength={2} /></Field>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" name="isDefault" className="size-4 rounded border-black/15 bg-bg-panel" /> Set as default
          </label>
          <div className="sm:col-span-2"><Button type="submit">Save Address</Button></div>
        </form>
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
