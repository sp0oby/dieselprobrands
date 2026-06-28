import "server-only";
import { NextResponse } from "next/server";

// Cron route guard. Fail-CLOSED: if CRON_SECRET is unset, requests are rejected.
// This avoids the foot-gun where a missing env var silently leaves cron endpoints
// world-callable (which can burn API quota, send emails, etc).
//
// In production, set CRON_SECRET in Vercel and have Vercel cron pass it via
// `Authorization: Bearer <secret>`.
export function requireCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new NextResponse("CRON_SECRET not configured", { status: 503 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return new NextResponse("forbidden", { status: 403 });
  return null;
}
