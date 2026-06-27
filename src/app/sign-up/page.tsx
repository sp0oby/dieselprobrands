import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Briefcase, User } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { RetailSignupForm } from "./retail-form";
import { BusinessSignupForm } from "./business-form";

type SearchParams = Promise<{ type?: "retail" | "business"; next?: string }>;

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const { type, next = "/account" } = await searchParams;

  if (!type) {
    return (
      <div className="container-x py-20">
        <div className="card-surface mx-auto max-w-2xl p-8">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-6 text-center text-2xl font-bold text-ink">Create your account</h1>
          <p className="mt-2 text-center text-sm text-ink-muted">Choose the option that fits how you'll buy from us.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href={`/sign-up?type=retail&next=${encodeURIComponent(next)}`}
              className="group flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-bg-card p-6 transition-all hover:border-brand/40 hover:-translate-y-0.5"
            >
              <User className="size-7 text-brand-400" />
              <h2 className="text-lg font-bold text-ink">Retail</h2>
              <p className="text-sm text-ink-muted">For individual buyers, mechanics, and DIY owners. Instant access, standard pricing.</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
                Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href={`/sign-up?type=business&next=${encodeURIComponent(next)}`}
              className="group flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-bg-card p-6 transition-all hover:border-brand/40 hover:-translate-y-0.5"
            >
              <Briefcase className="size-7 text-brand-400" />
              <h2 className="text-lg font-bold text-ink">Business / Dealer</h2>
              <p className="text-sm text-ink-muted">For shops, dealers, fleets, and wholesalers. Tiered pricing, volume discounts, net terms on approval.</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
                Apply <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="text-brand-400 hover:text-brand-300">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-20">
      <div className="card-surface mx-auto max-w-xl p-8">
        <div className="flex justify-center"><Logo /></div>
        {type === "retail" ? (
          <>
            <h1 className="mt-6 text-center text-2xl font-bold text-ink">Create your account</h1>
            <p className="mt-2 text-center text-sm text-ink-muted">Faster checkout, order history, saved addresses.</p>
            <Suspense><RetailSignupForm next={next} /></Suspense>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-center text-2xl font-bold text-ink">Business Account Application</h1>
            <p className="mt-2 text-center text-sm text-ink-muted">
              Tell us about your business. Approval typically takes 1–2 business days; you'll be able to browse with retail pricing in the meantime.
            </p>
            <Suspense><BusinessSignupForm next={next} /></Suspense>
          </>
        )}
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/sign-up" className="text-brand-400 hover:text-brand-300">← Back to account types</Link>
        </p>
      </div>
    </div>
  );
}
