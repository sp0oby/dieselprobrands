"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, promoCodes, customerPriceOverrides, products } from "@/db";
import type { PromoKind, PromoScope } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  if (!v || String(v).trim() === "") return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}
function parseInt(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createPromo(formData: FormData) {
  await assertAdmin();
  const kind = String(formData.get("kind") || "percent") as PromoKind;
  const valueRaw = Number(formData.get("value") || 0);
  // For "fixed" kinds, the form collects dollars; persist as cents.
  const value = kind === "fixed" ? Math.round(valueRaw * 100) : Math.round(valueRaw);
  await db.insert(promoCodes).values({
    code: String(formData.get("code") || "").trim().toUpperCase(),
    description: (String(formData.get("description") || "").trim() || null) as string | null,
    kind,
    value,
    minSubtotalCents: Math.round((Number(formData.get("minSubtotal") || 0)) * 100),
    maxDiscountCents: formData.get("maxDiscount") ? Math.round(Number(formData.get("maxDiscount")) * 100) : null,
    maxUses: parseInt(formData.get("maxUses")),
    perCustomerUses: parseInt(formData.get("perCustomerUses")),
    stackable: formData.get("stackable") === "on",
    scope: (String(formData.get("scope") || "all")) as PromoScope,
    scopeIds: String(formData.get("scopeIds") || "").split(",").map((s) => s.trim()).filter(Boolean),
    allowedTiers: (formData.getAll("allowedTiers") as string[]).filter(Boolean),
    startsAt: parseDate(formData.get("startsAt")),
    expiresAt: parseDate(formData.get("expiresAt")),
    active: formData.get("active") !== "off",
  });
  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}

export async function updatePromo(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const kind = String(formData.get("kind") || "percent") as PromoKind;
  const valueRaw = Number(formData.get("value") || 0);
  const value = kind === "fixed" ? Math.round(valueRaw * 100) : Math.round(valueRaw);
  await db
    .update(promoCodes)
    .set({
      code: String(formData.get("code") || "").trim().toUpperCase(),
      description: (String(formData.get("description") || "").trim() || null) as string | null,
      kind,
      value,
      minSubtotalCents: Math.round((Number(formData.get("minSubtotal") || 0)) * 100),
      maxDiscountCents: formData.get("maxDiscount") ? Math.round(Number(formData.get("maxDiscount")) * 100) : null,
      maxUses: parseInt(formData.get("maxUses")),
      perCustomerUses: parseInt(formData.get("perCustomerUses")),
      stackable: formData.get("stackable") === "on",
      scope: (String(formData.get("scope") || "all")) as PromoScope,
      scopeIds: String(formData.get("scopeIds") || "").split(",").map((s) => s.trim()).filter(Boolean),
      allowedTiers: (formData.getAll("allowedTiers") as string[]).filter(Boolean),
      startsAt: parseDate(formData.get("startsAt")),
      expiresAt: parseDate(formData.get("expiresAt")),
      active: formData.get("active") !== "off",
    })
    .where(eq(promoCodes.id, id));
  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}

export async function deletePromo(formData: FormData) {
  await assertAdmin();
  await db.delete(promoCodes).where(eq(promoCodes.id, String(formData.get("id"))));
  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}

// Customer price overrides ----------------------------------------------------

export async function setCustomerOverride(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId"));
  const sku = String(formData.get("sku") || "").trim();
  if (!sku) return;
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.sku, sku)).limit(1);
  if (!product) return;
  const priceCents = Math.round(Number(formData.get("price") || 0) * 100);
  await db
    .insert(customerPriceOverrides)
    .values({ userId, productId: product.id, priceCents, note: String(formData.get("note") || "") || null })
    .onConflictDoUpdate({
      target: [customerPriceOverrides.userId, customerPriceOverrides.productId],
      set: { priceCents, note: String(formData.get("note") || "") || null },
    });
  revalidatePath(`/admin/customers/${userId}`);
}

export async function removeCustomerOverride(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId"));
  const productId = String(formData.get("productId"));
  await db
    .delete(customerPriceOverrides)
    .where(and(eq(customerPriceOverrides.userId, userId), eq(customerPriceOverrides.productId, productId)));
  revalidatePath(`/admin/customers/${userId}`);
}
