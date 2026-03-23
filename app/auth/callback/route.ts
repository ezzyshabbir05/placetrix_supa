// app/auth/callback/route.ts
//
// Handles the server-side leg of the PKCE OAuth code exchange for:
//   - Google sign-in / sign-up
//   - Any other OAuth provider (GitHub, Discord …)
//
// Flow:
//   Provider → redirect → /auth/callback?code=…&next=…
//              │
//              └─ exchangeCodeForSession(code)  ← verifies PKCE verifier
//                 sets session cookie
//                 redirect → next (default /~)
//
// ── Supabase Dashboard setup ──────────────────────────────────────────────────
//
//  Authentication → URL Configuration → Redirect URLs:
//    http://localhost:3000/auth/callback          ← development
//    https://yourdomain.com/auth/callback         ← production
//
//  Authentication → Providers → Google:
//    Client ID     — from Google Cloud Console
//    Client Secret — from Google Cloud Console
//    Redirect URI to paste into Google Cloud: shown in Supabase dashboard
//
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/~";

  // Validate redirect target — only allow relative paths to prevent open redirects.
  const safeNext = next.startsWith("/") ? next : "/~";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(
        "No authorisation code returned from provider."
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}