"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr,auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ email });
          if (error) setMsg({ kind: "err", text: error.message });
          else setMsg({ kind: "ok", text: `Confirmation link sent to ${email}. Click it to confirm the change.` });
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new-email">Email address</Label>
        <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="self-end">
        <Button type="submit" disabled={pending || email === currentEmail}>Update email</Button>
      </div>
      {msg && (
        <p className={`sm:col-span-2 text-xs ${msg.kind === "ok" ? "text-emerald-300" : "text-amber-300"}`}>{msg.text}</p>
      )}
    </form>
  );
}

export function PasswordChangeForm() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        if (pw.length < 8) { setMsg({ kind: "err", text: "Password must be at least 8 characters." }); return; }
        if (pw !== confirm) { setMsg({ kind: "err", text: "Passwords don't match." }); return; }
        start(async () => {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) setMsg({ kind: "err", text: error.message });
          else { setMsg({ kind: "ok", text: "Password updated." }); setPw(""); setConfirm(""); }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new-pw">New password</Label>
        <Input id="new-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-pw">Confirm new password</Label>
        <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>Update password</Button>
      </div>
      {msg && (
        <p className={`sm:col-span-2 text-xs ${msg.kind === "ok" ? "text-emerald-300" : "text-amber-300"}`}>{msg.text}</p>
      )}
    </form>
  );
}
