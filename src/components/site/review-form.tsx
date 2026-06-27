"use client";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitReview } from "@/app/actions/reviews";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
        Thanks for your review! Verified purchases publish instantly; otherwise it'll appear after a quick moderation check.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        start(async () => {
          const res = await submitReview({ ...data, productId, rating });
          if (!res.ok) setError(res.error);
          else setDone(true);
        });
      }}
    >
      <div className="space-y-1">
        <Label>Your rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="p-1"
            >
              <Star className={cn("size-6", (hover || rating) >= n ? "fill-brand text-brand" : "text-white/20")} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" name="title" placeholder="Sums it up in a sentence" maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Review *</Label>
        <Textarea id="body" name="body" rows={5} required minLength={10} maxLength={2000} placeholder="What did and didn't work? Did it fit your application?" />
      </div>
      {error && <p className="text-sm text-amber-700">{error}</p>}
      <Button type="submit" size="lg" disabled={pending || rating === 0}>
        {pending ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
