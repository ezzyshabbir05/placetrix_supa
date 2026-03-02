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
import { AtSignIcon, CheckCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 sm:w-sm">
      {success ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-2 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
            <h1 className="font-bold text-2xl tracking-wide">Check Your Email</h1>
            <p className="text-base text-muted-foreground">
              A reset link was sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Check your inbox and spam folder.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">Forgot Password?</h1>
            <p className="text-base text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <InputGroup>
              <InputGroupInput
                placeholder="your.email@example.com" type="email"
                autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <InputGroupAddon align="inline-start"><AtSignIcon /></InputGroupAddon>
            </InputGroup>

            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
