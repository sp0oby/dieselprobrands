export default function TermsOfServicePage() {
  return (
    <div className="container-x py-16 max-w-4xl">
      <h1 className="text-4xl font-extrabold text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-ink-muted">
        <Section title="Acceptance of Terms">
          <p>By accessing dieselprobrands.com you agree to these terms. If you do not agree, do not use the site.</p>
        </Section>
        <Section title="Account Registration">
          <p>You're responsible for keeping your account credentials confidential and for all activity that happens under your account.</p>
        </Section>
        <Section title="Pricing & Availability">
          <p>Prices and inventory may change at any time without notice. We reserve the right to correct pricing errors and cancel orders affected by them.</p>
        </Section>
        <Section title="Shipping">
          <p>Shipping estimates are best efforts. Title and risk of loss pass to you when the carrier accepts the package.</p>
        </Section>
        <Section title="Returns & Warranty">
          <p>See our Returns & Warranty page for full policy details.</p>
        </Section>
        <Section title="Limitation of Liability">
          <p>To the maximum extent permitted by law, Diesel Pro Brands is not liable for indirect, incidental, special, or consequential damages.</p>
        </Section>
        <Section title="Governing Law">
          <p>These terms are governed by the laws of the State of Florida.</p>
        </Section>
        <Section title="Contact">
          <p>Questions: support@dieselprobrands.com · (866) 999-4361</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
