// app/auth/reset-password/page.tsx
//
// Single page that handles the entire password reset flow:
//
//   Step 1 — No recovery session present:
//     Shows the "enter your email" form (was previously /auth/forgot-password).
//     On submit → sends reset email via supabase.auth.resetPasswordForEmail.
//     On success → shows "check your email" confirmation.
//
//   Step 2 — Recovery session present (user arrived via email link):
//     /auth/confirm verified the token_hash server-side (cross-device ✓)
//     and established a recovery session in cookies before redirecting here.
//     Page detects the session and shows the "set new password" form.
//     On submit → calls supabase.auth.updateUser({ password }).
//     Signs out to invalidate the recovery session, then shows success.
//
// States:  loading → email-form | password-form | email-sent | expired | success

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  AtSignIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PageState =
  | "loading"
  | "email-form"
  | "email-sent"
  | "password-form"
  | "expired"
  | "success";

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("loading");

  // Email form state
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // On mount: check for an active recovery session.
  // If one exists, the user arrived here via their reset email link
  // (token was already verified by /auth/confirm), so show the password form.
  // If not, show the email-request form.
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setPageState("password-form");
      } else {
        setPageState("email-form");
      }
    };
    checkSession();
  }, []);

  // ── Step 1: Send reset email ─────────────────────────────────────────────
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setEmailLoading(true);
    setEmailError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Points to /auth/confirm so the token_hash flow is used
        // (cross-device compatible when custom email template is configured —
        // see /auth/confirm/route.ts for Supabase Dashboard setup instructions).
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
      });
      if (error) throw error;
      setPageState("email-sent");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Step 2: Update password ──────────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    const supabase = createClient();
    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Invalidate the recovery session so the link can't be reused.
      await supabase.auth.signOut();
      setPageState("success");
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="mx-auto flex sm:w-sm items-center justify-center py-12">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Email form ───────────────────────────────────────────────────────────
  if (pageState === "email-form") {
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

  // ── Email sent ───────────────────────────────────────────────────────────
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

  // ── Expired / Invalid Link ───────────────────────────────────────────────
  if (pageState === "expired") {
    return (
      <div className="mx-auto space-y-4 sm:w-sm text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlertIcon className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="font-bold text-2xl tracking-wide">Link Expired</h1>
          <p className="text-base text-muted-foreground">
            This password reset link is invalid or has already been used.
            Please request a new one.
          </p>
        </div>
        <Button asChild className="w-full" onClick={() => setPageState("email-form")}>
          <span>Request New Link</span>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="mx-auto space-y-4 sm:w-sm text-center">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-green-500/10">
          <CheckCircleIcon className="h-7 w-7 text-green-500" />
        </div>
        <div className="space-y-1">
          <h1 className="font-bold text-2xl tracking-wide">
            Password Updated!
          </h1>
          <p className="text-base text-muted-foreground">
            Your password has been reset successfully. Sign in with your new
            password to continue.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  // ── Password form ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto space-y-4 sm:w-sm">
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Set New Password</h1>
        <p className="text-base text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form className="space-y-2" onSubmit={handleUpdatePassword}>
        <InputGroup>
          <InputGroupInput
            placeholder="New password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <LockIcon />
          </InputGroupAddon>
          <InputGroupAddon
            align="inline-end"
            className="cursor-pointer"
            onClick={() => setShowPassword((p) => !p)}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupAddon>
        </InputGroup>

        <InputGroup>
          <InputGroupInput
            placeholder="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <LockIcon />
          </InputGroupAddon>
          <InputGroupAddon
            align="inline-end"
            className="cursor-pointer"
            onClick={() => setShowConfirm((p) => !p)}
          >
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupAddon>
        </InputGroup>

        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters.
        </p>

        {passwordError && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {passwordError}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={passwordLoading}>
          {passwordLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
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