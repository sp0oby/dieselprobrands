export default function PrivacyPolicyPage() {
  return (
    <div className="container-x py-16 max-w-4xl">
      <h1 className="text-4xl font-extrabold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <div className="prose prose-invert mt-10 max-w-none space-y-6 text-ink-muted">
        <Section title="Information We Collect">
          <p>We collect information you provide when creating an account, placing an order, or contacting us — including name, email, billing/shipping address, phone, and order details. We collect technical information automatically (device, browser, IP, pages visited) to operate the site.</p>
        </Section>
        <Section title="How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Respond to support requests</li>
            <li>Send transactional emails (order updates, shipping, returns)</li>
            <li>Improve our products and services</li>
            <li>Detect and prevent fraud</li>
          </ul>
        </Section>
        <Section title="Sharing">
          <p>We do not sell your information. We share data with service providers strictly to operate the business — payment processors, shipping carriers, email delivery, fraud prevention, and hosting providers — under contractual confidentiality obligations.</p>
        </Section>
        <Section title="Your Rights">
          <p>You can request access, correction, or deletion of your data at any time by emailing support@dieselprobrands.com. We honor opt-outs from marketing email immediately.</p>
        </Section>
        <Section title="Contact">
          <p>Privacy questions: support@dieselprobrands.com · (866) 999-4361</p>
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
