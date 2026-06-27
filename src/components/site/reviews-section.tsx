import { and, desc, eq } from "drizzle-orm";
import { ShieldCheck, ThumbsUp } from "lucide-react";
import { db, productReviews } from "@/db";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "./review-form";

export async function ReviewsSection({ productId }: { productId: string }) {
  let reviews: (typeof productReviews.$inferSelect)[] = [];
  try {
    reviews = await db
      .select()
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.status, "published")))
      .orderBy(desc(productReviews.createdAt))
      .limit(20);
  } catch {
    // DB not configured — silently show empty state with form disabled.
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-16 grid gap-10 lg:grid-cols-[1fr,360px]">
      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3">
              <StarRating value={avg} />
              <span className="text-sm text-ink">{avg.toFixed(1)} <span className="text-ink-muted">({reviews.length})</span></span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-6 rounded-md border border-black/[0.06] bg-bg-panel p-6 text-center text-sm text-ink-muted">
            No reviews yet. Be the first to share your experience with this part.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} />
                      {r.title && <span className="text-sm font-semibold text-ink">{r.title}</span>}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {r.authorName} · {new Date(r.createdAt).toLocaleDateString()}
                      {r.verifiedPurchase && (
                        <Badge variant="success" className="ml-2 normal-case tracking-normal">
                          <ShieldCheck className="mr-1 size-3" /> Verified
                        </Badge>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    <ThumbsUp className="size-3" /> {r.helpfulCount}
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-muted whitespace-pre-line">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="card-surface p-6 h-fit lg:sticky lg:top-24">
        <h3 className="text-lg font-bold text-ink">Write a review</h3>
        <p className="mt-1 text-xs text-ink-muted">Verified purchases publish instantly. Others go through quick moderation.</p>
        <div className="mt-4">
          <ReviewForm productId={productId} />
        </div>
      </aside>
    </section>
  );
}
