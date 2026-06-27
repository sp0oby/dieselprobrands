import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { PromoEditor } from "@/components/site/promo-editor";
import { db, promoCodes } from "@/db";
import { updatePromo, deletePromo } from "@/app/actions/promo";

export default async function AdminPromoEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!promo) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Edit Promo</h1>
        <form action={deletePromo}>
          <input type="hidden" name="id" value={promo.id} />
          <Button type="submit" variant="destructive">Delete</Button>
        </form>
      </div>
      <PromoEditor promo={promo} action={updatePromo} />
    </div>
  );
}
