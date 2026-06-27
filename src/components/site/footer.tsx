import Link from "next/link";
import { Logo } from "./logo";
import { SITE, FOOTER_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-bg-panel mt-24">
      <div className="container-x py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo size="lg" />
            <p className="text-sm text-ink-muted leading-relaxed">{SITE.description}</p>
            <div className="space-y-1 text-sm text-ink-muted">
              <p>📍 {SITE.address.street}</p>
              <p>{SITE.address.city}, {SITE.address.state} {SITE.address.zip}</p>
              <p>📞 <a href={SITE.phoneHref} className="text-brand-400 hover:text-brand-300">{SITE.phone}</a></p>
              <p>{SITE.address.city}, {SITE.address.state}</p>
            </div>
          </div>
          <FooterCol title="Shop" links={FOOTER_LINKS.shop} />
          <FooterCol title="Support" links={FOOTER_LINKS.support} />
          <FooterCol title="Company" links={FOOTER_LINKS.company} />
        </div>

        <div className="hairline mt-10 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">© {new Date().getFullYear()} Diesel Pro Brands. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span>Accepted Payment Methods:</span>
            {["VISA", "MC", "AMEX"].map((p) => (
              <span key={p} className="rounded border border-black/10 bg-black/5 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-ink">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-base font-bold text-ink">{title}</h4>
      <ul className="mt-5 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ink-muted transition-colors hover:text-brand-400">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
