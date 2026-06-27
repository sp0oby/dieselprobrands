import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="text-sm uppercase tracking-wider text-brand-400">404</p>
      <h1 className="mt-3 text-5xl font-extrabold text-ink">Part not found</h1>
      <p className="mt-3 text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild><Link href="/">Go Home</Link></Button>
        <Button asChild variant="outline"><Link href="/shop">Browse Parts</Link></Button>
      </div>
    </div>
  );
}
