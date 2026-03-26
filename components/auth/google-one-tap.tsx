// components/auth/google-one-tap.tsx
//
// Renders the Google One Tap floating prompt.
// Uses signInWithIdToken() — no redirect, instant session.
// Nonce is SHA-256 hashed: raw sent to Supabase, hashed sent to Google.
"use client";

import Script from "next/script";
import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ✅ Fix 1: Read at module scope so Next.js inlines the value at build time.
// Never read process.env inside a runtime closure — it may resolve as undefined.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: object) => void;
                    prompt: () => void;
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

    // ✅ Fix 2: Guard against double initialization (causes FedCM AbortError).
    // Both the useEffect and onReady can fire in the same tick if the script
    // is already cached — the ref ensures initialize() only runs once per mount.
    const initialized = useRef(false);

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
        // Guard: skip if already initialized, GSI not loaded, or client ID missing
        if (initialized.current) return;
        if (typeof window === "undefined" || !window.google?.accounts) return;

        if (!GOOGLE_CLIENT_ID) {
            console.error(
                "[GoogleOneTap] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID — " +
                "check your .env.local and restart the dev server."
            );
            return;
        }

        initialized.current = true;

        const supabase = createClient();
        
        // Skip prompt if a verified user session already exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            router.push(next);
            return;
        }

        const [nonce, hashedNonce] = await generateNonce();
        // Temporarily add at the top of the component body, remove after debugging
        console.log("[DEBUG] GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);

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
                }
            },
            nonce: hashedNonce,
        });

        window.google.accounts.id.prompt();
    }, [generateNonce, next, router]);

    useEffect(() => {
        if (window.google?.accounts) {
            initialize();
        }
    }, [initialize]);


    // Reset the guard and cancel the prompt on unmount
    useEffect(() => {
        return () => {
            initialized.current = false;
            window.google?.accounts.id.cancel();
        };
    }, []);

    return (
        <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={() => { initialize(); }}
        />
    );
}

