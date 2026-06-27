"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      onClick={() =>
        start(async () => {
          await createClient().auth.signOut();
          router.push("/");
          router.refresh();
        })
      }
      disabled={pending}
    >
      <LogOut /> Sign out
    </Button>
  );
}
