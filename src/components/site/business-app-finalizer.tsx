"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { submitBusinessApplication } from "@/app/actions/business-application";

const KEY = "dpb_pending_app";

// Mounts on /account. If the user just confirmed email after a business signup,
// the form payload is in sessionStorage — submit it server-side and clear.
export function BusinessAppFinalizer() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    setState("submitting");
    (async () => {
      try {
        const payload = JSON.parse(raw);
        const res = await submitBusinessApplication(payload);
        sessionStorage.removeItem(KEY);
        if (res.ok) {
          setState("done");
          router.refresh();
        } else {
          setState("error");
        }
      } catch {
        sessionStorage.removeItem(KEY);
        setState("error");
      }
    })();
  }, [router]);

  if (state === "done") {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 flex items-start gap-2">
        <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
        <p>Your business application was submitted. We'll respond within 1–2 business days.</p>
      </div>
    );
  }
  if (state === "submitting") {
    return <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Finalizing your business application…</div>;
  }
  return null;
}
