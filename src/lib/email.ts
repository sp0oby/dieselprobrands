import "server-only";

// Transactional email via Resend. No-op when RESEND_API_KEY is missing.
// To enable: install resend in package.json, set RESEND_API_KEY + RESEND_FROM env vars.

export type EmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(params: EmailParams): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured()) {
    // Log to server console so devs see what would have been sent.
    console.log(`[email-stub] to=${params.to} subject="${params.subject}" (RESEND_API_KEY missing)`);
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${txt.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---- email templates --------------------------------------------------------

export function abandonedCartEmail(args: { fullName?: string; cartUrl: string; itemCount: number; subtotal: string }) {
  const name = args.fullName ? args.fullName.split(" ")[0] : "there";
  return {
    subject: `${name}, you left ${args.itemCount} item${args.itemCount === 1 ? "" : "s"} in your cart`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #111;">
        <p style="font-size: 24px; font-weight: 800; color: #d32f2f; letter-spacing: -0.02em;">DIESEL PRO BRANDS</p>
        <h1 style="margin-top: 24px; font-size: 22px;">Hey ${name}, your cart is waiting</h1>
        <p style="color: #555; line-height: 1.5;">You left ${args.itemCount} item${args.itemCount === 1 ? "" : "s"} totaling ${args.subtotal} in your cart. Pop back over and finish the order — same-day shipping if you order before 2pm EST.</p>
        <p style="margin-top: 32px;">
          <a href="${args.cartUrl}" style="display: inline-block; background: #d32f2f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Resume Checkout</a>
        </p>
        <p style="margin-top: 32px; font-size: 12px; color: #888;">Questions? Reply to this email or call (866) 999-4361.</p>
      </div>
    `,
    text: `Your cart at Diesel Pro Brands is waiting. ${args.itemCount} item(s), ${args.subtotal}. Resume: ${args.cartUrl}`,
  };
}

export function orderConfirmationEmail(args: { orderNumber: string; total: string; trackUrl: string }) {
  return {
    subject: `Order ${args.orderNumber} confirmed — ${args.total}`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #111;">
        <p style="font-size: 24px; font-weight: 800; color: #d32f2f;">DIESEL PRO BRANDS</p>
        <h1 style="margin-top: 24px; font-size: 22px;">Order confirmed</h1>
        <p style="color: #555;">${args.orderNumber} · ${args.total}</p>
        <p style="margin-top: 24px;"><a href="${args.trackUrl}" style="background: #d32f2f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Track your order</a></p>
      </div>
    `,
    text: `Order ${args.orderNumber} confirmed. Total: ${args.total}. Track: ${args.trackUrl}`,
  };
}
