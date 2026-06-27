"use server";
import { revalidatePath } from "next/cache";
import { pullWarehouses, pullItemStock, pushSalesOrder } from "@/lib/zoho/inventory-sync";
import { pushContact } from "@/lib/zoho/customer-sync";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

export async function syncWarehousesNow() {
  await assertAdmin();
  const r = await pullWarehouses();
  revalidatePath("/admin/integrations");
  return r;
}

export async function syncItemsNow() {
  await assertAdmin();
  const r = await pullItemStock(20);
  revalidatePath("/admin/integrations");
  return r;
}

export async function pushContactNow(userId: string) {
  await assertAdmin();
  const r = await pushContact(userId);
  revalidatePath("/admin/integrations");
  return r;
}

export async function pushOrderNow(orderId: string) {
  await assertAdmin();
  const r = await pushSalesOrder(orderId);
  revalidatePath("/admin/integrations");
  return r;
}
