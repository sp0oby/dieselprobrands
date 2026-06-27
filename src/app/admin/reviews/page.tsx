import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { db, productReviews, products, reviewStatusValues } from "@/db";
import { setReviewStatus } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const rows = await db
    .select({ r: productReviews, productName: products.name, productSlug: products.slug })
    .from(productReviews)
    .innerJoin(products, eq(products.id, productReviews.productId))
    .where(eq(productReviews.status, status as (typeof reviewStatusValues)[number]))
    .orderBy(desc(productReviews.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Reviews</h1>
      <div className="mt-4 flex gap-2">
        {reviewStatusValues.map((s) => (
          <Link
            key={s}
            href={s === "pending" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm capitalize",
              status === s ? "border-brand bg-brand text-white" : "border-black/10 text-ink-muted hover:text-ink",
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="card-surface p-12 text-center text-ink-muted">No {status} reviews.</p>}
        {rows.map(({ r, productName, productSlug }) => (
          <div key={r.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/shop/${productSlug}`} className="text-sm font-semibold text-ink hover:text-brand-400">{productName}</Link>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-ink-muted">{r.authorName} · {new Date(r.createdAt).toLocaleDateString()}</span>
                  {r.verifiedPurchase && <Badge variant="success">verified</Badge>}
                </div>
                {r.title && <p className="mt-2 text-sm font-semibold text-ink">{r.title}</p>}
                <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
              </div>
              <Badge variant={r.status === "published" ? "success" : r.status === "rejected" ? "outline" : "warning"}>{r.status}</Badge>
            </div>
            {r.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <form action={setReviewStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="published" />
                  <Button type="submit" size="sm">Publish</Button>
                </form>
                <form action={setReviewStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">Reject</Button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
