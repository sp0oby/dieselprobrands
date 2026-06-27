import { PromoEditor } from "@/components/site/promo-editor";
import { createPromo } from "@/app/actions/promo";

export default function AdminPromoNew() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">New Promo Code</h1>
      <PromoEditor action={createPromo} />
    </div>
  );
}
