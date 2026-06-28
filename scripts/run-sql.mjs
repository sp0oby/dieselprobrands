#!/usr/bin/env node
// Run a SQL file against DATABASE_URL. Used to apply Drizzle migrations
// without setting up the full drizzle-kit migration tracking table.
// Usage: node scripts/run-sql.mjs drizzle/0008_webhook_idempotency_promo_unique.sql

import { readFile } from "fs/promises";
import { resolve } from "path";
import postgres from "postgres";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/run-sql.mjs <path-to-sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = await readFile(resolve(file), "utf8");
console.log(`Applying ${file} (${sql.length} chars) ...`);

const client = postgres(url, { prepare: false, max: 1 });
try {
  await client.unsafe(sql);
  console.log("OK");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
