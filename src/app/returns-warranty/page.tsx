import Link from "next/link";
import { Phone, Mail, ArrowRight, Package, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export default function ReturnsWarrantyPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16">
          <span className="pill">Returns, Warranties &amp; Core Exchange</span>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-ink sm:text-6xl">Returns &amp; Warranty Policy</h1>
          <p className="mt-5 max-w-3xl text-lg text-ink-muted">
            We stand behind the quality of every part we sell. Learn about our hassle-free returns, comprehensive warranties, and core exchange program.
          </p>
        </div>
      </section>

      <section className="container-x py-12 grid gap-10 lg:grid-cols-[1fr,320px]">
        <div className="space-y-12">
          <Block title="Core Return Program" icon={Package}>
            <h3 className="text-lg font-bold text-ink">What is a Core?</h3>
            <p className="text-ink-muted">A "core" is your old, used part (such as a turbocharger, injector, or alternator) that can be rebuilt and returned to inventory. Many diesel parts carry a core charge that is refunded when you return the old part.</p>
            <h3 className="text-lg font-bold text-ink mt-6">Core Return Requirements</h3>
            <ul className="list-disc pl-5 text-ink-muted space-y-1">
              <li>Return your core within <span className="text-brand-400 font-semibold">30 days</span> of purchase to receive full core credit</li>
              <li>Core must be the same type and model as the purchased part (no substitutions)</li>
              <li>Core must be complete with all major components intact (no damaged housings)</li>
              <li>Use the original packaging and include the core return slip from your shipment</li>
              <li>Drain all fluids before shipping to comply with shipping regulations</li>
            </ul>
            <h3 className="text-lg font-bold text-ink mt-6">Core Return Process</h3>
            <Steps items={[
              { n: 1, title: "Package Core", body: "Use original packaging and include core return slip" },
              { n: 2, title: "Ship Back", body: "Use prepaid return label (orders $500+) or your carrier" },
              { n: 3, title: "Get Refund", body: "Core credit processed within 5-7 business days" },
            ]} />
          </Block>

          <Block title="Standard Returns" icon={RefreshCcw}>
            <h3 className="text-lg font-bold text-ink">Return Eligibility</h3>
            <ul className="list-disc pl-5 text-ink-muted space-y-1">
              <li><span className="text-brand-400 font-semibold">60-day return window</span> from date of purchase</li>
              <li>Parts must be unused, uninstalled, and in original packaging</li>
              <li>All accessories, manuals, and hardware must be included</li>
              <li>RMA (Return Merchandise Authorization) number required</li>
            </ul>
            <h3 className="text-lg font-bold text-ink mt-6">Non-Returnable Items</h3>
            <ul className="list-disc pl-5 text-ink-muted space-y-1">
              <li>Electrical parts that have been installed or connected</li>
              <li>Custom-ordered or special-order parts</li>
              <li>Clearance or final sale items</li>
              <li>Fluids, chemicals, or consumable products once opened</li>
            </ul>
            <p className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <strong>Restocking Fee:</strong> A 15% restocking fee applies to all returns except defective parts or shipping errors. Orders over $2,500 may be subject to a 20% restocking fee.
            </p>
          </Block>

          <Block title="Warranty Coverage" icon={ShieldCheck}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card-surface p-5">
                <p className="text-3xl font-extrabold text-brand-400">2 Years</p>
                <p className="font-bold text-ink mt-1">Standard Warranty</p>
                <p className="text-sm text-ink-muted mt-1">Covers all parts against defects in materials and workmanship under normal use.</p>
              </div>
              <div className="card-surface p-5">
                <p className="text-3xl font-extrabold text-brand-400">5 Years</p>
                <p className="font-bold text-ink mt-1">Extended Warranty</p>
                <p className="text-sm text-ink-muted mt-1">Available on select premium parts for maximum peace of mind.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold text-ink">What's Covered</h3>
                <ul className="mt-2 list-disc pl-5 text-ink-muted space-y-1">
                  <li>Defective parts or workmanship</li>
                  <li>Manufacturing defects</li>
                  <li>Parts failure under normal use</li>
                  <li>Replacement or repair at our discretion</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">What's Not Covered</h3>
                <ul className="mt-2 list-disc pl-5 text-ink-muted space-y-1">
                  <li>Damage from improper installation or misuse</li>
                  <li>Normal wear and tear or cosmetic damage</li>
                  <li>Damage from accidents, racing, or off-road use</li>
                  <li>Labor costs for removal or installation</li>
                  <li>Consequential or indirect damages</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 card-surface p-5">
              <h4 className="font-bold text-ink">Making a Warranty Claim</h4>
              <p className="mt-2 text-sm text-ink-muted">
                To file a warranty claim, contact our support team with your order number, part number, and description of the issue. We may require photos or the part to be returned for inspection.
              </p>
              <Button asChild variant="outline" className="mt-4"><Link href="/contact">Contact Support <ArrowRight /></Link></Button>
            </div>
          </Block>

          <Block title="How to Initiate a Return">
            <Steps items={[
              { n: 1, title: "Request RMA Number", body: "Contact our customer service team via phone or email with your order number and reason for return. We'll issue an RMA number within 24 hours." },
              { n: 2, title: "Package the Item", body: "Carefully package the part in its original box with all accessories. Write the RMA number clearly on the outside of the package." },
              { n: 3, title: "Ship the Return", body: "Ship to the address provided with your RMA. We recommend using a carrier with tracking. Save your tracking number for reference." },
              { n: 4, title: "Receive Your Refund", body: "Once we receive and inspect your return, we'll process your refund within 5-7 business days to your original payment method." },
            ]} />
          </Block>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface p-6">
            <h3 className="text-lg font-bold text-ink">Need Help?</h3>
            <p className="mt-2 text-sm text-ink-muted">Our customer service team is ready to assist with returns and warranty claims.</p>
            <p className="mt-4 inline-flex items-center gap-2 text-brand-400"><Phone className="size-4" /> {SITE.phone}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-brand-400"><Mail className="size-4" /> returns@dieselprobrands.com</p>
          </div>
          <div className="card-surface p-6">
            <h3 className="text-lg font-bold text-ink">Key Points</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-ink-muted">Returns</span><span className="text-ink font-semibold">60-day window</span></li>
              <li className="flex justify-between"><span className="text-ink-muted">Warranty</span><span className="text-ink font-semibold">2-year standard</span></li>
              <li className="flex justify-between"><span className="text-ink-muted">Core Returns</span><span className="text-ink font-semibold">30-day deadline</span></li>
              <li className="flex justify-between"><span className="text-ink-muted">Restocking</span><span className="text-ink font-semibold">15% fee standard</span></li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="size-6 text-brand-400" />}
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
function Steps({ items }: { items: { n: number; title: string; body: string }[] }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {items.map((s) => (
        <div key={s.n} className="card-surface p-5">
          <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{s.n}</span>
          <h4 className="mt-3 font-bold text-ink">{s.title}</h4>
          <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
        </div>
      ))}
    </div>
  );
}
