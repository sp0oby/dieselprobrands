"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { trackingUrlFor } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

export async function setTrackingNumber(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const tn = String(formData.get("trackingNumber") || "").trim();
  if (!tn) return;
  await db
    .update(orders)
    .set({
      trackingNumber: tn,
      trackingUrl: trackingUrlFor(tn),
      shippedAt: new Date(),
      status: "shipped",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));
  revalidatePath(`/admin/orders`);
  revalidatePath(`/orders/${id}`);
}
