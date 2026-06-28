import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, profiles } from "@/db";
import { pushContact } from "@/lib/zoho/customer-sync";

// Only accept relative, same-origin paths to avoid open-redirect abuse via the
// `next` query param (e.g. `?next=//evil.com` or `?next=https://evil.com`).
function sanitizeNext(raw: string | null): string {
  if (!raw) return "/account";
  // Must start with a single "/" and not be a protocol-relative URL ("//host").
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  // Reject backslash tricks some browsers fold into "/".
  if (raw.includes("\\")) return "/account";
  return raw;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const meta = data.user.user_metadata ?? {};
      const customerType = meta.customer_type === "business" ? "business" : "retail";
      await db
        .insert(profiles)
        .values({
          id: data.user.id,
          email: data.user.email!,
          fullName: (meta.full_name as string) ?? null,
          phone: (meta.phone as string) ?? null,
          companyName: (meta.company_name as string) ?? null,
          customerType,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            email: data.user.email!,
            fullName: (meta.full_name as string) ?? null,
            phone: (meta.phone as string) ?? null,
            companyName: (meta.company_name as string) ?? null,
          },
        });
      // Fire-and-forget Zoho CRM sync. No-op if not configured.
      pushContact(data.user.id).catch(() => {});
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
