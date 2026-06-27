import Link from "next/link";
import { CreditCard, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountPaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Payment Methods</h2>
        <p className="mt-1 text-sm text-ink-muted">How we handle your payment information.</p>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-6 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-ink">Payments are processed by Stripe</h3>
            <p className="mt-2 text-sm text-ink-muted">
              For your security, we don't store credit-card numbers on our servers. Every checkout uses Stripe's
              hosted payment form (PCI-compliant). You can choose to save your card at checkout — Stripe stores it,
              tied to your account, and re-uses it on future orders.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-ink-muted">
              <li>• Visa, Mastercard, Amex, Discover</li>
              <li>• Apple Pay, Google Pay</li>
              <li>• ACH bank transfers for B2B (Net 30 / 60 / 90 on approval)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card-surface p-12 text-center">
        <CreditCard className="mx-auto size-10 text-ink-dim" />
        <h3 className="mt-4 text-lg font-bold text-ink">No saved cards yet</h3>
        <p className="mt-2 text-sm text-ink-muted">When you complete your next order, you can opt to save the card here for one-click checkout.</p>
        <Button asChild className="mt-6"><Link href="/shop">Continue Shopping <ArrowRight /></Link></Button>
      </div>
    </div>
  );
}
