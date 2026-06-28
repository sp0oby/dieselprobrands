import { NextResponse } from "next/server";
import { fetchInvoicePdf } from "@/lib/zoho/books-sync";
import { resolveOrderAccess } from "@/lib/order-access";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t");
  const access = await resolveOrderAccess(id, token);
  if (!access.ok) {
    if (access.reason === "not-found") return new NextResponse("not found", { status: 404 });
    if (access.reason === "needs-sign-in") {
      return NextResponse.redirect(new URL(`/sign-in?next=/orders/${id}`, req.url));
    }
    return new NextResponse("forbidden", { status: 403 });
  }
  const { order } = access;

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

  // Fall back to the print-friendly HTML page (carry the access token if any).
  const fallback = new URL(`/orders/${id}/invoice`, req.url);
  if (access.viewer === "guest-token" && token) fallback.searchParams.set("t", token);
  return NextResponse.redirect(fallback);
}
