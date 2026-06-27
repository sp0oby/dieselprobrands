import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { fetchInvoicePdf } from "@/lib/zoho/books-sync";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return new NextResponse("not found", { status: 404 });
  if (order.userId && user?.id !== order.userId) {
    const allow = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
    if (!user?.email || !allow.includes(user.email.toLowerCase())) {
      return NextResponse.redirect(new URL(`/sign-in?next=/orders/${id}`, req.url));
    }
  }

  if (order.zohoInvoiceId) {
    const buf = await fetchInvoicePdf(order.zohoInvoiceId);
    if (buf) {
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="DPB-${String(order.number).padStart(6, "0")}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
  }

  // Fall back to the print-friendly HTML page.
  return NextResponse.redirect(new URL(`/orders/${id}/invoice`, req.url));
}
