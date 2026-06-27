import { NextResponse } from "next/server";
import { pullWarehouses, pullItemStock } from "@/lib/zoho/inventory-sync";

// Periodic Zoho Inventory pull. Wire in vercel.ts cron: 0 */1 * * * → /api/cron/zoho-sync
// Protect with CRON_SECRET header in production.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new NextResponse("forbidden", { status: 403 });
  }
  const wh = await pullWarehouses();
  const items = await pullItemStock(10);
  return NextResponse.json({ warehouses: wh, items });
}
