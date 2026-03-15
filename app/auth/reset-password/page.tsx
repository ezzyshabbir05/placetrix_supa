// app/auth/reset-password/page.tsx
//
// Step 1 of the password reset flow.
// Collects the user's email and triggers a reset email via Supabase.
//
// The email points to /auth/confirm?token_hash=...&type=recovery
// which verifies the OTP server-side and redirects to /auth/change-password.
//
// States: email-form → email-sent

"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  AtSignIcon,
  CheckCircleIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PageState = "email-form" | "email-sent";

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("email-form");
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setEmailLoading(true);
    setEmailError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // /auth/confirm handles token_hash verification (cross-device ✓).
        // For recovery, /auth/confirm ignores `next` and always redirects
        // to /auth/change-password?mode=recovery — but it's documented here
        // for clarity.
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/change-password`,
      });
      if (error) throw error;
      setPageState("email-sent");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Email sent ─────────────────────────────────────────────────────────
  if (pageState === "email-sent") {
    return (
      <div className="mx-auto space-y-4 sm:w-sm">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircleIcon className="h-7 w-7 text-green-500" />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">
              Check Your Email
            </h1>
            <p className="text-base text-muted-foreground">
              A reset link was sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Check your inbox and spam folder.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            The link works from any device or browser.
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MailIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={() => setPageState("email-form")}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Try again
              </button>{" "}
              or check your spam folder.
            </span>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  // ── Email form ─────────────────────────────────────────────────────────
  return (
    <div className="mx-auto space-y-4 sm:w-sm">
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Reset Password</h1>
        <p className="text-base text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form className="space-y-2" onSubmit={handleSendEmail}>
        <InputGroup>
          <InputGroupInput
            placeholder="your.email@example.com"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <AtSignIcon />
          </InputGroupAddon>
        </InputGroup>

        {emailError && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {emailError}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={emailLoading}>
          {emailLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
