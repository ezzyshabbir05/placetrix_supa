"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    const supabase = createClient();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 sm:w-sm">
      <div className="flex flex-col space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Set New Password</h1>
        <p className="text-base text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroupInput
            placeholder="New password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start"><LockIcon /></InputGroupAddon>
          <InputGroupAddon align="inline-end" className="cursor-pointer"
            onClick={() => setShowPassword((p) => !p)}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupAddon>
        </InputGroup>

        <InputGroup>
          <InputGroupInput
            placeholder="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password" required
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-start"><LockIcon /></InputGroupAddon>
          <InputGroupAddon align="inline-end" className="cursor-pointer"
            onClick={() => setShowConfirm((p) => !p)}>
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupAddon>
        </InputGroup>

        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save New Password"}
        </Button>
      </form>
    </div>
  );
}
