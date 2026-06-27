"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, profiles, addresses } from "@/db";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  return user;
}

// ---- profile settings ------------------------------------------------------

const ProfileSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  companyName: z.string().max(120).optional(),
});

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = ProfileSchema.safeParse({
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    companyName: String(formData.get("companyName") || ""),
  });
  if (!parsed.success) return;
  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || null,
    })
    .where(eq(profiles.id, user.id));
  revalidatePath("/account/settings");
  revalidatePath("/account");
}

// ---- addresses CRUD --------------------------------------------------------

const AddressSchema = z.object({
  label: z.string().min(1).max(40),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(40),
  zip: z.string().min(1).max(20),
  country: z.string().min(2).max(2).optional(),
  isDefault: z.boolean().optional(),
});

export async function saveAddress(formData: FormData) {
  const user = await requireUser();
  const id = (String(formData.get("id") || "").trim() || null);
  const parsed = AddressSchema.safeParse({
    label: String(formData.get("label") || ""),
    line1: String(formData.get("line1") || ""),
    line2: String(formData.get("line2") || ""),
    city: String(formData.get("city") || ""),
    state: String(formData.get("state") || ""),
    zip: String(formData.get("zip") || ""),
    country: String(formData.get("country") || "US"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return;
  const v = parsed.data;

  if (v.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }

  if (id) {
    await db
      .update(addresses)
      .set({
        label: v.label, line1: v.line1, line2: v.line2 || null,
        city: v.city, state: v.state, zip: v.zip,
        country: v.country || "US", isDefault: Boolean(v.isDefault),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  } else {
    await db.insert(addresses).values({
      userId: user.id,
      label: v.label, line1: v.line1, line2: v.line2 || null,
      city: v.city, state: v.state, zip: v.zip,
      country: v.country || "US", isDefault: Boolean(v.isDefault),
    });
  }
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}
