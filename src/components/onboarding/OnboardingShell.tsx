"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "./ChatWindow";
import { Loader2 } from "lucide-react";

export function OnboardingShell() {
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function ensureAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setReady(true);
        return;
      }

      // Auto-create an anonymous account (persists across reloads)
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("Auto-signup failed:", error);
      }

      setReady(true);
    }

    ensureAuth();
  }, [supabase]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return <ChatWindow />;
}
