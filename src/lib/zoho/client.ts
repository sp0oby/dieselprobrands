import "server-only";
import { eq } from "drizzle-orm";
import { db, zohoTokens, syncLog } from "@/db";

// Zoho OAuth + token refresh client.
// Works across CRM, Inventory, and Books — they share auth.
//
// Required env (when ready to wire real Zoho):
//   ZOHO_CLIENT_ID           — OAuth client from https://api-console.zoho.com
//   ZOHO_CLIENT_SECRET
//   ZOHO_REFRESH_TOKEN       — long-lived refresh token (generate once)
//   ZOHO_DATA_CENTER         — "com" | "eu" | "in" | "com.au" | "jp"  (default "com")
//   ZOHO_ORG_ID              — Inventory + Books org id (header "organization_id")
//
// All Zoho helpers no-op gracefully when these are missing.

export type ZohoService = "crm" | "inventory" | "books";

export function isZohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN,
  );
}

const DATA_CENTER = process.env.ZOHO_DATA_CENTER ?? "com";

const ACCOUNTS_HOST = `https://accounts.zoho.${DATA_CENTER}`;
const API_HOSTS: Record<ZohoService, string> = {
  crm: `https://www.zohoapis.${DATA_CENTER}/crm/v6`,
  inventory: `https://www.zohoapis.${DATA_CENTER}/inventory/v1`,
  books: `https://www.zohoapis.${DATA_CENTER}/books/v3`,
};

async function refresh(service: ZohoService): Promise<{ accessToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${ACCOUNTS_HOST}/oauth/v2/token`, { method: "POST", body });
  if (!res.ok) throw new Error(`Zoho refresh failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number; api_domain?: string };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function getAccessTokenFor(service: ZohoService): Promise<string> {
  return getAccessToken(service);
}

async function getAccessToken(service: ZohoService): Promise<string> {
  if (!isZohoConfigured()) throw new Error("Zoho not configured");
  const [existing] = await db.select().from(zohoTokens).where(eq(zohoTokens.service, service)).limit(1);
  const now = Date.now();
  if (existing && existing.expiresAt.getTime() > now + 60_000) {
    return existing.accessToken;
  }
  const { accessToken, expiresIn } = await refresh(service);
  const expiresAt = new Date(now + (expiresIn - 60) * 1000);
  await db
    .insert(zohoTokens)
    .values({
      service,
      accessToken,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
      expiresAt,
      dataCenter: DATA_CENTER,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: zohoTokens.service,
      set: { accessToken, expiresAt, dataCenter: DATA_CENTER, updatedAt: new Date() },
    });
  return accessToken;
}

export async function zohoFetch<T = unknown>(
  service: ZohoService,
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> },
): Promise<T> {
  if (!isZohoConfigured()) throw new Error("Zoho not configured");
  const token = await getAccessToken(service);

  const url = new URL(`${API_HOSTS[service]}${path}`);
  if (init?.params) {
    for (const [k, v] of Object.entries(init.params)) if (v != null) url.searchParams.set(k, String(v));
  }
  // Inventory + Books require organization_id on every request.
  if ((service === "inventory" || service === "books") && process.env.ZOHO_ORG_ID && !url.searchParams.has("organization_id")) {
    url.searchParams.set("organization_id", process.env.ZOHO_ORG_ID);
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Zoho-oauthtoken ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zoho ${service} ${res.status}: ${text.slice(0, 400)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- audit log helpers -----------------------------------------------------

export async function logSync(params: {
  service: ZohoService | "stripe" | "supabase" | "scraper";
  operation: string;
  status: "ok" | "error";
  recordsAffected?: number;
  error?: string | null;
  durationMs?: number;
}) {
  try {
    await db.insert(syncLog).values({
      service: params.service,
      operation: params.operation,
      status: params.status,
      recordsAffected: params.recordsAffected ?? 0,
      error: params.error ?? null,
      durationMs: params.durationMs ?? null,
    });
  } catch {
    // best-effort logging — never let logging break the real work
  }
}

export async function getLastSyncs(limit = 20) {
  return db
    .select()
    .from(syncLog)
    .orderBy(/* desc(syncLog.startedAt) */ syncLog.startedAt)
    .limit(limit);
}
