import "server-only";
import type { Scraper, ScrapedProduct } from "./types";

// Magento store. The product API isn't publicly exposed and the sitemap returns 404 on the
// default path. Production-ready scraping requires:
//   1) Authenticated REST API access via TAMERX_ACCESS_TOKEN, OR
//   2) Apify actor that crawls /search-by-make/{brand}/engine-{model}.html paths
//
// The adapter is registered so the admin console shows it; fetch is a no-op until configured.

export const tamerxScraper: Scraper = {
  source: "tamerx",
  label: "Tamerx Diesel Products",
  description: "Magento store. Configure TAMERX_ACCESS_TOKEN or run via Apify to enable.",
  async fetch(): Promise<ScrapedProduct[]> {
    // No-op until creds wired.
    return [];
  },
};
