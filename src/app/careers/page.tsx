import Link from "next/link";
import {
  Briefcase, MapPin, Heart, TrendingUp, Mail, GraduationCap, Laptop, PiggyBank,
  Users, Sparkles, ArrowRight, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { JobsList } from "./jobs-list";
import { JOBS } from "./jobs";

const CAREERS_EMAIL = "careers@dieselprobrands.com";


const BENEFITS = [
  { icon: Heart, title: "Health & Wellness", body: "Medical, dental, and vision on day one. We cover 100% of the employee premium." },
  { icon: TrendingUp, title: "Work-Life Balance", body: "Unlimited PTO, flexible hours, and we mean it — leadership takes vacations too." },
  { icon: PiggyBank, title: "Competitive Comp", body: "Above-market base salaries, performance bonuses, and 401(k) with 4% match." },
  { icon: GraduationCap, title: "Learning Budget", body: "$2,000/year for courses, conferences, and books. Plus on-the-job rebuild training." },
  { icon: Laptop, title: "Equipment", body: "Latest MacBook Pro or PC of your choice, ergonomic setup, and home-office stipend." },
  { icon: Users, title: "Real Ownership", body: "Equity for full-timers. We're privately held — your work directly grows your stake." },
];

const STATS = [
  { icon: Users, label: "team members" },
  { icon: Briefcase, label: "founded 2019" },
  { icon: MapPin, label: "Jacksonville, FL HQ" },
];

export default function CareersPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-black/[0.04] bg-bg-panel/40">
        <div className="absolute inset-0 -z-10 bg-hero-glow" />
        <div className="container-x py-16 lg:py-20 text-center">
          <span className="pill mx-auto"><Sparkles className="size-3.5" /> Join Our Team</span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Build the future of <span className="heading-gradient">diesel parts</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-muted">
            We're building the most transparent, fastest-shipping diesel parts shop in the country.
            Join a team that knows the parts inside and out — and cares about the operators who run them.
          </p>
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-brand-400" /> Growing team</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 text-brand-400" /> Family-owned</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-brand-400" /> Jacksonville HQ · Remote-friendly</span>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink">Benefits & Perks</h2>
          <p className="mt-2 text-ink-muted max-w-2xl mx-auto">
            We invest in our team with real compensation and benefits that support your whole life.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card-surface p-6">
              <span className="grid size-11 place-items-center rounded-lg bg-brand/15 text-brand-400">
                <b.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-ink">Open Positions</h2>
            <p className="mt-1 text-sm text-ink-muted">
              <span className="text-ink font-semibold">{JOBS.length}</span> opportunit{JOBS.length === 1 ? "y" : "ies"} available
            </p>
          </div>
        </div>
        <div className="mt-8"><JobsList jobs={JOBS} careersEmail={CAREERS_EMAIL} /></div>
      </section>

      <section className="container-x pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-10 md:p-12 text-center">
          <div className="relative">
            <Sparkles className="mx-auto size-9 text-white" />
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Don't see the right role?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              We're always looking for talented people who love diesel and care about doing the work right.
              Send your resume and tell us about yourself.
            </p>
            <Button asChild size="lg" className="mt-6 bg-white text-brand hover:bg-white/90">
              <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("General application")}`}>
                <Mail className="size-4" /> Submit a general application
              </a>
            </Button>
            <p className="mt-4 text-xs text-white/80">{CAREERS_EMAIL} · {SITE.phone}</p>
          </div>
        </div>
      </section>
    </>
  );
}
