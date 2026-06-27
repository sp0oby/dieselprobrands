import "server-only";
import { eq } from "drizzle-orm";
import { db, profiles, isDbConfigured } from "@/db";
import { createClient } from "./supabase/server";
import type { Tier } from "@/db/schema";

export async function getCurrentTier(): Promise<Tier> {
  if (!isDbConfigured()) return "retail";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "retail";
    const [profile] = await db.select({ tier: profiles.tier }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
    return (profile?.tier ?? "retail") as Tier;
  } catch {
    return "retail";
  }
}
