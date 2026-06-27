"use client";
import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container-x py-20"><div className="card-surface mx-auto max-w-md p-8 text-center text-ink-muted">Loading…</div></div>}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="container-x py-20">
      <div className="card-surface mx-auto max-w-md p-8">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-center text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">Sign in to your DieselPro account</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const supabase = createClient();
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) setError(error.message);
              else router.push(next);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={pending} className="w-full">{pending ? "Signing in..." : "Sign In"}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New here? <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="text-brand-400 hover:text-brand-600">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
