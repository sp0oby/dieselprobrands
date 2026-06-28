import "server-only";
import { createClient } from "./supabase/server";

function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(email.toLowerCase());
}

export async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

// Throws if the caller is not an admin. Use as the first line of every
// admin-only server action — server actions are addressable as POSTs and
// the surrounding page's auth check does NOT protect them.
export async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) throw new Error("Forbidden");
  return user!;
}
