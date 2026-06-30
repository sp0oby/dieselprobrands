// One-shot: insert the in-house "Diesel Pro Brands" brand into the brands
// table so it appears in the Admin → Products → New Product brand dropdown.
//
// Run from project root with DATABASE_URL set:  node scripts/seed-dpb-brand.mjs
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}
const sql = postgres(url, { prepare: false });

const dpb = {
  slug: "dpb",
  name: "DPB",
  display_name: "Diesel Pro Brands",
  category: "House Brand",
  country: "USA",
  founded: 2020,
  description:
    "Our in-house line — VGT turbochargers, fuel pumps, fuel injectors, and engine parts engineered to OEM-spec and backed by our 2-year warranty.",
  product_count: 0,
  featured: true,
};

const [existing] = await sql`select slug from brands where slug = ${dpb.slug}`;
if (existing) {
  await sql`
    update brands set
      name = ${dpb.name},
      display_name = ${dpb.display_name},
      category = ${dpb.category},
      country = ${dpb.country},
      founded = ${dpb.founded},
      description = ${dpb.description},
      featured = ${dpb.featured}
    where slug = ${dpb.slug}
  `;
  console.log("updated existing DPB brand row");
} else {
  await sql`
    insert into brands (slug, name, display_name, category, country, founded, description, product_count, featured)
    values (${dpb.slug}, ${dpb.name}, ${dpb.display_name}, ${dpb.category}, ${dpb.country}, ${dpb.founded}, ${dpb.description}, ${dpb.product_count}, ${dpb.featured})
  `;
  console.log("inserted DPB brand row");
}

await sql.end();
