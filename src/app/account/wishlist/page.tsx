import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { createClient } from "@/lib/supabase/server";
import { listWishlistProducts } from "@/lib/wishlist-queries";

export default async function AccountWishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  const items = await listWishlistProducts(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Wishlist</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {items.length === 0
            ? "Save parts you want to come back to. Tap the heart on any product card."
            : `${items.length} item${items.length === 1 ? "" : "s"} saved.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Heart className="mx-auto size-10 text-ink-dim" />
          <h3 className="mt-4 text-lg font-bold text-ink">Your wishlist is empty</h3>
          <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
            Browse the catalog and tap the heart on any product to save it here for later.
          </p>
          <Button asChild className="mt-6"><Link href="/shop">Browse parts <ArrowRight /></Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <ProductCard key={p.id} p={p} initialWished />)}
        </div>
      )}
    </div>
  );
}
