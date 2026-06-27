import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Lazy-init: never connect at import time. A missing URL throws only when a query runs,
// so the app boots and pages can fall back to seed data while you wire Supabase.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
function getDb() {
  if (_db) return _db;
  if (!connectionString) throw new Error("DATABASE_URL is not set — configure Supabase and re-run.");
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_t, prop) {
    const target = getDb() as unknown as Record<string, unknown>;
    return target[prop as string];
  },
});

export const isDbConfigured = () => Boolean(connectionString);
export * from "./schema";
