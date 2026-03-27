"use client";

import Script from "next/script";
import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// ✅ Global lock to prevent overlapping FedCM requests.
// States: 
// - idle: No GSI activity.
// - initializing: Running async checks (getClaims).
// - prompting: window.google.accounts.id.prompt() has been called.
let globalGsiState: "idle" | "initializing" | "prompting" = "idle";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: { 
            isDisplayMoment: () => boolean; 
            isSkippedMoment: () => boolean;
            getSkippedReason: () => string;
          }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  /** Where to redirect after a successful One Tap sign-in. Defaults to /~ */
  next?: string;
}

export function GoogleOneTap({ next = "/~" }: GoogleOneTapProps) {
  const router = useRouter();
  const initialized = useRef(false);
  const isMounted = useRef(true);

  const generateNonce = useCallback(async (): Promise<[string, string]> => {
    const rawNonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
    const encoded = new TextEncoder().encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashedNonce = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return [rawNonce, hashedNonce];
  }, []);

  const initialize = useCallback(async () => {
    // 1. Guards
    if (initialized.current) return;
    if (globalGsiState !== "idle") return;
    if (typeof window === "undefined" || !window.google?.accounts) return;

    if (!GOOGLE_CLIENT_ID) {
      console.warn("[GoogleOneTap] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    initialized.current = true;
    globalGsiState = "initializing";

    try {
      const supabase = createClient();
      
      // 2. Local JWT check via getClaims()
      const { data: authData } = await supabase.auth.getClaims();
      
      if (!isMounted.current) {
        globalGsiState = "idle";
        return;
      }
      
      if (authData?.claims) {
        // Already authenticated — release lock and exit
        globalGsiState = "idle";
        return;
      }

      const [nonce, hashedNonce] = await generateNonce();
      
      if (!isMounted.current) {
        globalGsiState = "idle";
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce,
            });
            if (error) throw error;
            router.push(next);
            router.refresh();
          } catch (err) {
            console.error("[GoogleOneTap] signInWithIdToken error:", err);
          } finally {
            globalGsiState = "idle";
          }
        },
        nonce: hashedNonce,
        auto_select: true, // UX improvement: auto-sign-in if single account
        use_fedcm_for_prompt: true,
      });

      // 3. Prompting phase
      setTimeout(() => {
        if (!isMounted.current) {
          globalGsiState = "idle";
          return;
        }

        globalGsiState = "prompting";
        
        window.google?.accounts.id.prompt((notification) => {
          if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason();
            // "tap_outside", "user_cancel", etc.
            if (reason !== "user_cancel") {
                console.log("[GoogleOneTap] Prompt skipped:", reason);
            }
            globalGsiState = "idle";
          }
        });
      }, 50);

    } catch (err) {
      console.error("[GoogleOneTap] Initialization failed:", err);
      globalGsiState = "idle";
    }
  }, [generateNonce, next, router]);

  useEffect(() => {
    isMounted.current = true;
    if (window.google?.accounts) {
      initialize();
    }
    return () => {
      isMounted.current = false;
      // Only call cancel() if we actually had an active prompt.
      // Calling cancel() during 'initializing' is unnecessary and can cause AbortErrors.
      if (initialized.current) {
        if (globalGsiState === "prompting") {
          window.google?.accounts.id.cancel();
        }
        globalGsiState = "idle";
      }
    };
  }, [initialize]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => { initialize(); }}
    />
  );
}
