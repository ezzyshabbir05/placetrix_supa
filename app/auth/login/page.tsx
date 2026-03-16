// app/auth/login/page.tsx
//
// Login flow with mandatory email confirmation gate:
//
//   login-form   → signInWithPassword()
//                  ✓ confirmed   → redirect /~
//                  ✗ unconfirmed → resend OTP → otp-entry
//
//   otp-entry    → verifyOtp({ email, token, type: 'signup' })
//                  ✓ verified → session active → redirect /~
//
// Industry practice: never let an unconfirmed account access the app.
// We resend a fresh OTP immediately so the user doesn't have to go back
// to sign-up — they finish confirmation inline right from the login screen.
"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { OTPInput } from "@/components/ui/otp-input";
import { AtSignIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PageState = "login-form" | "otp-entry";

const RESEND_COOLDOWN = 60;

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>("login-form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Loading / error ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cooldown timer ─────────────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); },
    []
  );

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Supabase returns this exact message for unconfirmed accounts.
        if (error.message === "Email not confirmed") {
          // Send a fresh OTP so the user can confirm right here.
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email,
          });
          if (resendError) throw resendError;

          setPageState("otp-entry");
          startCooldown();
          return;
        }
        throw error;
      }

      router.push("/~");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify OTP (confirm email then sign in) ────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 8) {
      setError("Please enter the full 8-digit code");
      return;
    }
    setError(null);

    const supabase = createClient();
    setIsLoading(true);

    try {
      // verifyOtp with type 'signup' confirms the email AND establishes a session.
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });
      if (error) throw error;

      router.push("/~");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);

    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      startCooldown();
      setOtp("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/~` },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  // ── OTP screen (email confirmation gate) ──────────────────────────────────
  if (pageState === "otp-entry") {
    return (
      <div className="mx-auto space-y-6 sm:w-sm">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailIcon className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">Confirm Your Email</h1>
            <p className="text-base text-muted-foreground">
              Your email isn&apos;t confirmed yet. We sent an 8-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          />

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2 text-center">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            type="submit"
            disabled={isLoading || otp.length < 8}
          >
            {isLoading ? "Verifying..." : "Confirm & Sign In"}
          </Button>
        </form>

        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MailIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Didn&apos;t receive it?{" "}
              {resendCooldown > 0 ? (
                <span>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Resend code
                </button>
              )}{" "}
              or check your spam folder.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setPageState("login-form"); setOtp(""); setError(null); }}
          className="w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto space-y-4 sm:w-sm">
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Welcome Back!</h1>
        <p className="text-base text-muted-foreground">
          Sign in to your account to continue.
        </p>
      </div>

      <Button
        className="w-full"
        variant="outline"
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="flex w-full items-center justify-center">
        <div className="h-px w-full bg-border" />
        <span className="px-2 text-muted-foreground text-xs">OR</span>
        <div className="h-px w-full bg-border" />
      </div>

      <form className="space-y-2" onSubmit={handleLogin}>
        <p className="text-start text-muted-foreground text-xs">
          Enter your credentials to sign in
        </p>
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

        <InputGroup>
          <InputGroupInput
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="underline underline-offset-4 hover:text-primary"
        >
          Create one
        </Link>
      </p>
      <p className="text-muted-foreground text-xs text-center">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}