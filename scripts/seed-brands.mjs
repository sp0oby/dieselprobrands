// Upsert every brand from src/lib/site.ts into the Postgres `brands` table so
// they're all selectable in Admin -> Products -> New Product.
//
// Idempotent: existing rows are updated, missing rows are inserted, rows in
// the DB that aren't in BRANDS are left alone (we never delete).
//
// Run from project root with DATABASE_URL set:
//   node --import tsx scripts/seed-brands.mjs
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import postgres from "postgres";
import { BRANDS } from "../src/lib/site.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}
const sql = postgres(url, { prepare: false });

let inserted = 0, updated = 0;
for (const b of BRANDS) {
  const [existing] = await sql`select slug from brands where slug = ${b.slug}`;
  if (existing) {
    await sql`
      update brands set
        name = ${b.name},
        display_name = ${b.displayName},
        category = ${b.category},
        country = ${b.country},
        founded = ${b.founded},
        description = ${b.description},
        featured = ${b.featured}
      where slug = ${b.slug}
    `;
    updated++;
  } else {
    await sql`
      insert into brands (slug, name, display_name, category, country, founded, description, product_count, featured)
      values (${b.slug}, ${b.name}, ${b.displayName}, ${b.category}, ${b.country}, ${b.founded}, ${b.description}, ${b.count}, ${b.featured})
    `;
    inserted++;
    console.log(`  + inserted ${b.slug}`);
  }
}
console.log(`\ninserted ${inserted}, updated ${updated}, total in site.ts: ${BRANDS.length}`);
await sql.end();
