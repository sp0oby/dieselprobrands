import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, profiles } from "@/db";
import { pushContact } from "@/lib/zoho/customer-sync";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

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
