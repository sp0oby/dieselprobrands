import { NextResponse } from "next/server";
import { pullWarehouses, pullItemStock } from "@/lib/zoho/inventory-sync";
import { requireCronAuth } from "@/lib/cron-auth";

// Periodic Zoho Inventory pull. Wire in vercel.ts cron: 0 */1 * * * → /api/cron/zoho-sync
// Protect with CRON_SECRET header in production.
export async function GET(req: Request) {
  const denied = requireCronAuth(req);
  if (denied) return denied;
  const wh = await pullWarehouses();
  const items = await pullItemStock(10);
  return NextResponse.json({ warehouses: wh, items });
}
