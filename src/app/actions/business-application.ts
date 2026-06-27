"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, profiles, businessApplications, type Tier } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { pushContact } from "@/lib/zoho/customer-sync";

const Schema = z.object({
  companyName: z.string().min(2),
  taxId: z.string().min(2),
  industry: z.string().min(2),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  monthlyVolumeUsd: z.coerce.number().min(0).optional(),
  requestedTier: z.enum(["dealer", "wholesale", "vip"]),
  notes: z.string().optional(),
});

export type SubmitResult = { ok: true; id: string } | { ok: false; error: string };

export async function submitBusinessApplication(input: unknown): Promise<SubmitResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fill in all required fields correctly." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to apply." };

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email!,
      fullName: (user.user_metadata?.full_name as string) ?? null,
      companyName: parsed.data.companyName,
      phone: (user.user_metadata?.phone as string) ?? null,
      customerType: "business",
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { companyName: parsed.data.companyName, customerType: "business" },
    });

  // Don't allow multiple pending applications
  const pending = await db
    .select({ id: businessApplications.id })
    .from(businessApplications)
    .where(and(eq(businessApplications.userId, user.id), eq(businessApplications.status, "pending")))
    .limit(1);
  if (pending[0]) return { ok: false, error: "You already have a pending application — we'll respond shortly." };

  const [row] = await db
    .insert(businessApplications)
    .values({
      userId: user.id,
      companyName: parsed.data.companyName,
      taxId: parsed.data.taxId,
      industry: parsed.data.industry,
      websiteUrl: parsed.data.websiteUrl || null,
      monthlyVolumeUsd: parsed.data.monthlyVolumeUsd ?? null,
      requestedTier: parsed.data.requestedTier as Tier,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: businessApplications.id });

  revalidatePath("/account");
  revalidatePath("/admin/applications");
  return { ok: true, id: row.id };
}

// Admin actions ---------------------------------------------------------------

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
  return user;
}

export async function approveApplication(applicationId: string, tier: Tier, note?: string) {
  const reviewer = await assertAdmin();
  const [app] = await db
    .update(businessApplications)
    .set({ status: "approved", reviewedBy: reviewer.id, reviewedAt: new Date(), approvedTier: tier, reviewerNote: note ?? null })
    .where(eq(businessApplications.id, applicationId))
    .returning();
  if (app) {
    await db.update(profiles).set({ tier, customerType: "business" }).where(eq(profiles.id, app.userId));
    pushContact(app.userId).catch(() => {});
  }
  revalidatePath("/admin/applications");
  revalidatePath("/admin/customers");
}

export async function rejectApplication(applicationId: string, note?: string) {
  const reviewer = await assertAdmin();
  await db
    .update(businessApplications)
    .set({ status: "rejected", reviewedBy: reviewer.id, reviewedAt: new Date(), reviewerNote: note ?? null })
    .where(eq(businessApplications.id, applicationId));
  revalidatePath("/admin/applications");
}

export async function overrideTier(userId: string, tier: Tier) {
  await assertAdmin();
  await db.update(profiles).set({ tier }).where(eq(profiles.id, userId));
  pushContact(userId).catch(() => {});
  revalidatePath("/admin/customers");
}
