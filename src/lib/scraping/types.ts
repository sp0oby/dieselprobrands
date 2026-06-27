// Common shape every scraper adapter must produce. Matches our SeedProduct schema
// so the upsert pipeline can write straight into the products table.

export type ScrapedProduct = {
  source: string;             // "fabheavy" | "fridayparts" | "tamerx" | ...
  sku: string;
  name: string;
  brand: string;              // brand slug from BRANDS list
  category: string;           // category slug from CATEGORIES list
  priceCents: number;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  imageUrl: string | null;
  inStock: boolean;
  replacementPartNumbers: string[];
};

export type ScraperResult = {
  source: string;
  fetched: number;
  imported: number;
  skipped: number;
  errors: string[];
};

export type Scraper = {
  source: string;
  label: string;
  description: string;
  /** Returns transformed products ready to upsert. */
  fetch: () => Promise<ScrapedProduct[]>;
};
