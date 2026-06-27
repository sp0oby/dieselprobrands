"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function RetailSignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <p className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
        Check your email to confirm your account, then sign in.
      </p>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const supabase = createClient();
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, customer_type: "retail" },
              emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
          if (error) setError(error.message);
          else setSent(true);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password (min 8 chars)</Label>
        <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
