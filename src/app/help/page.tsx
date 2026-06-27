import Link from "next/link";
import { MessageCircle, Mail, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/lib/site";

const FAQ_GROUPS = [
  {
    title: "Orders & Shipping",
    items: [
      { q: "How can I track my order?", a: "Enter your order number in the search bar above or visit your Order History page." },
      { q: "What are your shipping options?", a: "Standard (3-5 days), expedited (2-3 days), and overnight. Free shipping on orders over $500." },
      { q: "Do you ship internationally?", a: "Yes, we ship to most countries worldwide. Rates and delivery times vary." },
      { q: "Can I change my shipping address after placing an order?", a: "If the order hasn't shipped, contact our support team and we'll update it." },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      { q: "What is your return policy?", a: "30-day return window for most products. Items must be unused and in original packaging." },
      { q: "How do I initiate a return?", a: "Request an RMA from your Order History. We'll send return shipping instructions." },
      { q: "How long do refunds take?", a: "Refunds process within 5-10 business days of receiving the return." },
    ],
  },
  {
    title: "Account & Billing",
    items: [
      { q: "How do I create a business account?", a: "Apply during registration or on our B2B Application page. Approval in 1-2 business days." },
      { q: "What payment methods do you accept?", a: "Visa, Mastercard, Amex, PayPal, and ACH. B2B accounts may qualify for Net 30/60/90." },
      { q: "Can I get volume discounts?", a: "Yes — tiered pricing: 10-49 units (10% off), 50-99 (18% off), 100+ (25% off)." },
    ],
  },
  {
    title: "Products & Inventory",
    items: [
      { q: "How do I find the right part?", a: "Use the search bar to find parts by SKU or part number. Browse by category or brand." },
      { q: "Are your parts OEM or aftermarket?", a: "We carry both — product descriptions clearly indicate manufacturer and part type." },
      { q: "What if a product is out of stock?", a: "Enable stock alerts on the product page — we'll email you when it's back." },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16 lg:py-20">
          <span className="pill">We're Here to Help</span>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-ink sm:text-6xl">Help &amp; Support</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Get instant answers, track your order, or contact our support team
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <SupportCard icon={MessageCircle} title="Live Chat" body="Chat with our support team in real-time" meta="Average response: <2 min" />
          <SupportCard icon={Mail} title="Email Support" body="Send us a detailed message" meta="Response within 24 hours" />
          <SupportCard icon={Phone} title="Call Us" body={`Speak directly with a specialist — ${SITE.phone}`} meta={SITE.hours} />
        </div>
      </section>

      <section className="container-x pb-12">
        <div className="card-surface p-8">
          <h2 className="text-2xl font-bold text-ink">Track Your Order</h2>
          <p className="mt-2 text-ink-muted">Enter your order number to see real-time tracking information</p>
          <form action="/orders" method="GET" className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
              <Input name="number" placeholder="DPB-2026-001" className="pl-10" />
            </div>
            <Button type="submit">Track Order</Button>
          </form>
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink">Frequently Asked Questions</h2>
          <p className="mt-2 text-ink-muted">Find quick answers to common questions</p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {FAQ_GROUPS.map((g) => (
            <div key={g.title} className="card-surface p-6">
              <h3 className="text-lg font-bold text-ink">{g.title}</h3>
              <div className="mt-4 space-y-3">
                {g.items.map((it) => (
                  <details key={it.q} className="group rounded-md border border-black/[0.06] bg-bg-panel/40 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-ink flex items-center justify-between">
                      {it.q}<span className="text-brand-400 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-ink-muted leading-relaxed">{it.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          <form action="/contact" method="POST" className="card-surface p-8 space-y-5">
            <h2 className="text-2xl font-bold text-ink">Send Us a Message</h2>
            <p className="text-ink-muted">Fill out the form below and we'll get back to you within 24 hours</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your Name"><Input name="name" required /></Field>
              <Field label="Email Address"><Input name="email" type="email" required /></Field>
            </div>
            <Field label="Subject">
              <select name="subject" className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
                <option>Select a topic</option>
                <option>Order Status</option>
                <option>Shipping Question</option>
                <option>Returns & Refunds</option>
                <option>Product Information</option>
                <option>Account Issues</option>
                <option>Billing Question</option>
                <option>Technical Support</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Message"><Textarea name="message" rows={6} required /></Field>
            <Button type="submit" size="lg">Send Message</Button>
          </form>
          <aside className="space-y-4">
            <div className="card-surface p-6"><h3 className="text-base font-bold text-ink">Email</h3><a href={`mailto:${SITE.emailSupport}`} className="mt-2 block text-brand-400">{SITE.emailSupport}</a></div>
            <div className="card-surface p-6"><h3 className="text-base font-bold text-ink">Phone</h3><a href={SITE.phoneHref} className="mt-2 block text-brand-400">{SITE.phone}</a></div>
            <div className="card-surface p-6"><h3 className="text-base font-bold text-ink">Hours</h3><p className="mt-2 text-ink-muted">Mon-Fri: 8AM-8PM EST</p><p className="text-ink-muted">Sat-Sun: 9AM-5PM EST</p></div>
          </aside>
        </div>
      </section>
    </>
  );
}

function SupportCard({ icon: Icon, title, body, meta }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; meta: string }) {
  return (
    <div className="card-surface p-6">
      <Icon className="size-7 text-brand-400" />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
      <p className="mt-3 text-xs text-ink-dim">{meta}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
