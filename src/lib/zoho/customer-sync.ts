import "server-only";
import { eq } from "drizzle-orm";
import { db, profiles, type Tier } from "@/db";
import { isZohoConfigured, zohoFetch, logSync } from "./client";

// Map a profiles row to a Zoho CRM Contact payload.
// Field names follow Zoho CRM v6 schema. "DPB_Tier" + "DPB_Customer_Type" are custom fields
// you should add to the Contacts module via Zoho's Setup > Modules > Contacts UI.
function toContactPayload(profile: typeof profiles.$inferSelect) {
  const nameParts = (profile.fullName ?? profile.email).split(" ");
  return {
    Last_Name: nameParts.slice(-1).join(" ") || profile.email,
    First_Name: nameParts.slice(0, -1).join(" ") || undefined,
    Email: profile.email,
    Phone: profile.phone ?? undefined,
    Account_Name: profile.companyName ?? undefined,
    DPB_Tier: profile.tier,
    DPB_Customer_Type: profile.customerType,
    Lead_Source: "DieselPro Brands Web",
  };
}

export async function pushContact(userId: string): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  const started = Date.now();
  if (!isZohoConfigured()) {
    await logSync({ service: "crm", operation: "push_contact", status: "ok", error: "skipped: not configured" });
    return { ok: true };
  }
  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!profile) return { ok: false, error: "profile not found" };

    const payload = toContactPayload(profile);
    let contactId: string | null = profile.zohoContactId;

    if (contactId) {
      await zohoFetch("crm", `/Contacts/${contactId}`, { method: "PUT", body: JSON.stringify({ data: [payload] }) });
    } else {
      const result = await zohoFetch<{ data: Array<{ details?: { id?: string } }> }>("crm", "/Contacts/upsert", {
        method: "POST",
        body: JSON.stringify({ data: [payload], duplicate_check_fields: ["Email"] }),
      });
      contactId = result?.data?.[0]?.details?.id ?? null;
      if (contactId) {
        await db.update(profiles).set({ zohoContactId: contactId, zohoSyncedAt: new Date() }).where(eq(profiles.id, userId));
      }
    }

    await db.update(profiles).set({ zohoSyncedAt: new Date() }).where(eq(profiles.id, userId));
    await logSync({ service: "crm", operation: "push_contact", status: "ok", recordsAffected: 1, durationMs: Date.now() - started });
    return { ok: true, contactId: contactId ?? undefined };
  } catch (e) {
    const err = (e as Error).message;
    await logSync({ service: "crm", operation: "push_contact", status: "error", error: err, durationMs: Date.now() - started });
    return { ok: false, error: err };
  }
}

// Convenience: also mirror tier changes to Zoho.
export async function pushTierChange(userId: string, _tier: Tier) {
  return pushContact(userId);
}
