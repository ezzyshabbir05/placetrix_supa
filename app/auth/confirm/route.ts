// app/auth/confirm/route.ts
//
// Handles ALL email-based verification flows using token_hash (OTP method).
// This is DEVICE-INDEPENDENT — unlike the PKCE code flow used for OAuth,
// token_hash verification requires no stored verifier, so links work from
// any device or browser.
//
// Handles:
//   - Email address confirmation after sign-up  (type=signup)
//   - Password reset recovery links             (type=recovery)
//   - Email change confirmation                 (type=email_change)
//   - Magic link sign-in                        (type=magiclink)
//
// ── Required Supabase Email Template Configuration ────────────────────────────
//
// For cross-device support, update your Supabase email templates in:
//   Dashboard → Authentication → Email Templates
//
// Confirm signup template — "Confirm your mail" action URL:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/~
//
// Reset password template — "Reset Password" action URL:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
//
// This bypasses Supabase's own verification redirect (which adds a PKCE code)
// and sends the token_hash directly to your app, enabling cross-device use.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/~";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(
        "Invalid verification link — missing token or type"
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  // Recovery tokens always go to the password reset page so the user
  // can immediately set a new password within the established session.
  //
  // ?mode=recovery tells the reset-password page that this visit came via a
  // legitimate reset link (not a logged-in user who navigated here directly).
  // The auth layout's recovery exception also uses the pathname — the query
  // param gives the reset-password page its own layer of confirmation.
  if (type === "recovery") {
    return NextResponse.redirect(
      `${origin}/auth/reset-password?mode=recovery`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
