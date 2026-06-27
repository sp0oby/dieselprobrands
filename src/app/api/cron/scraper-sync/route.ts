import { NextResponse } from "next/server";
import { runScraper } from "@/lib/scraping/pipeline";

// Periodic catalog refresh. Default: weekly via vercel.ts cron.
// fabheavy is direct (Shopify /products.json — no Apify needed).
// fridayparts requires APIFY_FRIDAYPARTS_DATASET_ID set.
// tamerx skipped until creds wired.

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new NextResponse("forbidden", { status: 403 });
  }

  const results = [];
  for (const source of ["fabheavy", "fridayparts"]) {
    try {
      const r = await runScraper(source);
      results.push(r);
    } catch (e) {
      results.push({ source, error: (e as Error).message });
    }
  }
  return NextResponse.json({ results });
}
