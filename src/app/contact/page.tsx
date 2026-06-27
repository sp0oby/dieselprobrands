import { Phone, Mail, MapPin, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SITE } from "@/lib/site";
import { submitContactForm } from "@/app/actions/contact";

const FAQ = [
  { q: "What's your return policy?", a: "We offer a 30-day return policy on all unused parts in original packaging." },
  { q: "Do you ship internationally?", a: "Yes, we ship to over 25 countries worldwide with tracked shipping." },
  { q: "Are your parts OEM or aftermarket?", a: "We carry both OEM and premium aftermarket parts that meet or exceed OEM standards." },
  { q: "How can I track my order?", a: "You'll receive a tracking number via email once your order ships." },
];

const PERKS = [
  "Sales team trained to rebuild diesel parts",
  "Same-day shipping available",
  "Longest warranty of any online site",
  "Complete transparency on pricing",
  "Serving agricultural, highway, construction & marine",
];

export default function ContactPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16 lg:py-20">
          <h1 className="text-5xl font-extrabold leading-tight text-ink sm:text-6xl">
            Get in <span className="heading-gradient">Touch</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Have questions about our diesel parts? Our expert team is here to help. Reach out and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <InfoCard icon={Phone} title="Phone" lines={["Questions? Call Us", SITE.phone]} />
          <InfoCard icon={Mail} title="Email" lines={[SITE.emailInfo, SITE.emailSupport]} />
          <InfoCard icon={MapPin} title="Address" lines={[SITE.address.street, `${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`]} />
          <InfoCard icon={Clock} title="Business Hours" lines={[SITE.hours, "Jacksonville, FL"]} />
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <form action={submitContactForm} className="card-surface p-8 lg:col-span-2 space-y-5">
            <h2 className="text-2xl font-bold text-ink">Send us a Message</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full Name *"><Input id="fullName" name="fullName" required /></Field>
              <Field id="email" label="Email Address *"><Input id="email" name="email" type="email" required /></Field>
              <Field id="phone" label="Phone Number"><Input id="phone" name="phone" type="tel" /></Field>
              <Field id="department" label="Department *">
                <select id="department" name="department" required className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
                  <option value="">Select department</option>
                  <option>Sales Inquiry</option>
                  <option>Technical Support</option>
                  <option>Order Status</option>
                  <option>Returns & Exchanges</option>
                  <option>Partnership Opportunities</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
            <Field id="subject" label="Subject *"><Input id="subject" name="subject" required /></Field>
            <Field id="message" label="Message *"><Textarea id="message" name="message" rows={6} required /></Field>
            <Button type="submit" size="lg" className="w-full sm:w-auto">Send Message</Button>
          </form>

          <div className="space-y-5">
            <div className="card-surface p-6">
              <h3 className="text-lg font-bold text-ink">Why Choose Diesel Pro Brands?</h3>
              <ul className="mt-4 space-y-3">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-muted">
                    <Check className="mt-0.5 size-4 text-brand-400 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-surface p-6">
              <h3 className="text-lg font-bold text-ink">Need Immediate Help?</h3>
              <p className="mt-2 text-sm text-ink-muted">Call our support line for urgent inquiries and real-time assistance.</p>
              <a href={SITE.phoneHref} className="mt-4 inline-flex items-center gap-2 text-lg font-bold text-brand-400 hover:text-brand-300">
                <Phone className="size-5" /> {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink">Common Questions</h2>
          <p className="mt-2 text-ink-muted">Quick answers to frequently asked questions</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="card-surface p-6">
              <h4 className="text-base font-bold text-ink">{f.q}</h4>
              <p className="mt-2 text-sm text-ink-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: React.ComponentType<{ className?: string }>; title: string; lines: string[] }) {
  return (
    <div className="card-surface p-6">
      <Icon className="size-6 text-brand-400" />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-ink-muted">{l}</p>
      ))}
    </div>
  );
}
function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
