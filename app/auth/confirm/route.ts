// app/auth/confirm/route.ts
//
// Fallback handler for LINK-based email verification flows (token_hash / OTP method).
//
// This route is NOT part of the primary OTP flow — users entering a 6-digit
// code in the UI are verified client-side via supabase.auth.verifyOtp().
//
// This route handles cases where:
//   - A user clicks a link in an older-style email template
//   - Your email template contains both a code and a link ({{ .ConfirmationURL }})
//   - You need cross-device link support as a fallback
//
// This is DEVICE-INDEPENDENT — unlike PKCE code flow used for OAuth,
// token_hash requires no stored verifier, so links work from any device.
//
// Handles:
//   - Email address confirmation after sign-up  (type=signup)
//   - Password reset recovery links             (type=recovery)
//   - Email change confirmation                 (type=email_change)
//   - Magic link sign-in                        (type=magiclink)
//
// ── Supabase Email Template Configuration (link-based fallback) ───────────────
//
// If you want to support BOTH OTP codes and clickable links in the same email,
// include both {{ .Token }} and {{ .ConfirmationURL }} in your template:
//
// Confirm signup:
//   Your code: {{ .Token }}
//   Or click: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/~
//
// Reset password:
//   Your code: {{ .Token }}
//   Or click: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
//
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
  // ?mode=recovery tells change-password that this visit came via a
  // legitimate reset link (not a logged-in user who navigated here directly).
  if (type === "recovery") {
    return NextResponse.redirect(
      `${origin}/auth/change-password?mode=recovery`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}