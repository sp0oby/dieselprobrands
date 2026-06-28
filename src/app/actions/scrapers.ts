"use server";
import { revalidatePath } from "next/cache";
import { db, scrapeRuns } from "@/db";
import { runScraper, SCRAPERS } from "@/lib/scraping/pipeline";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("unauthorized");
  const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!allow.includes(user.email.toLowerCase())) throw new Error("unauthorized");
}

// Long-form catch-all: never let a scraper failure crash the admin page.
// Instead, the failure is logged to the scrape_runs table so the admin UI can
// surface it in the "Recent runs" panel. fabheavy is the slow one (full Shopify
// catalog with rate-limit sleeps), which is why the host page sets a higher
// maxDuration — see src/app/admin/scrapers/page.tsx.
export async function runScraperNow(formData: FormData) {
  await assertAdmin();
  const source = String(formData.get("source"));
  if (!SCRAPERS[source]) throw new Error(`unknown source ${source}`);
  try {
    await runScraper(source);
  } catch (e) {
    console.error(`runScraperNow ${source} failed:`, e);
    // runScraper already records its own scrape_runs row on partial failure;
    // this catches the hard "fetch threw before any row was written" case.
    await db.insert(scrapeRuns).values({
      source,
      status: "error",
      fetched: 0,
      imported: 0,
      skipped: 0,
      error: (e as Error).message?.slice(0, 500) ?? "unknown error",
      durationMs: 0,
      endedAt: new Date(),
    }).catch(() => {});
  }
  revalidatePath("/admin/scrapers");
}
