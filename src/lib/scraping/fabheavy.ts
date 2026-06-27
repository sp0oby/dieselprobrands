import "server-only";
import { cleanText, inferBrand, inferCategory, parsePriceCents, slugify } from "./shared";
import { extractOemNumbersFromText } from "../oem";
import type { Scraper, ScrapedProduct } from "./types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

type ShopifyVariant = { id: number; sku?: string | null; price?: string | null; available?: boolean };
type ShopifyImage = { src?: string | null };
type ShopifyProduct = {
  id: number;
  title?: string | null;
  handle?: string | null;
  body_html?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
};

async function fetchPage(page: number, limit: number): Promise<ShopifyProduct[]> {
  const url = `https://www.fabheavyparts.com/products.json?limit=${limit}&page=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fab Heavy HTTP ${res.status}`);
  const data = (await res.json()) as { products?: ShopifyProduct[] };
  return data.products ?? [];
}

export const fabHeavyScraper: Scraper = {
  source: "fabheavy",
  label: "Fab Heavy Parts",
  description: "Shopify /products.json — full catalog, paginated 250 per page.",
  async fetch(): Promise<ScrapedProduct[]> {
    const out: ScrapedProduct[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 200; page++) {
      const products = await fetchPage(page, 250);
      if (!products.length) break;
      for (const p of products) {
        const variant = p.variants?.[0];
        if (!variant) continue;
        const sku = String(variant.sku ?? variant.id ?? "").trim();
        if (!sku || seen.has(sku)) continue;
        const cents = parsePriceCents(variant.price);
        if (!cents) continue;
        const name = cleanText(p.title ?? "");
        if (name.length < 5) continue;
        const image = p.images?.[0]?.src ?? null;
        if (!image) continue;
        seen.add(sku);

        const desc = cleanText(p.body_html ?? "");
        const brand = inferBrand(`${name} ${p.vendor ?? ""} ${p.product_type ?? ""}`);
        const category = inferCategory(`${name} ${p.product_type ?? ""}`);

        out.push({
          source: "fabheavy",
          sku,
          name,
          brand,
          category,
          priceCents: cents,
          shortDescription: desc.split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? name,
          description: desc.slice(0, 1500),
          specs: { Warranty: "2 years" },
          imageUrl: image,
          inStock: variant.available !== false,
          replacementPartNumbers: extractOemNumbersFromText(desc),
        });
      }
      if (products.length < 250) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    return out;
  },
};
