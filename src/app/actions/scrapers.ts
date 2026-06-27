"use server";
import { revalidatePath } from "next/cache";
import { runScraper, SCRAPERS } from "@/lib/scraping/pipeline";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

export async function runScraperNow(formData: FormData) {
  await assertAdmin();
  const source = String(formData.get("source"));
  if (!SCRAPERS[source]) throw new Error(`unknown source ${source}`);
  await runScraper(source);
  revalidatePath("/admin/scrapers");
}
