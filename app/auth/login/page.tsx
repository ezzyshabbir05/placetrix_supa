"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { AtSignIcon, EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.push("/protected");
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const supabase = createClient();
        setIsGoogleLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback?next=/protected` },
        });
        if (error) {
            setError(error.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="mx-auto space-y-4 sm:w-sm">
            <div className="flex flex-col space-y-1">
                <h1 className="font-bold text-2xl tracking-wide">Welcome Back!</h1>
                <p className="text-base text-muted-foreground">
                    Sign in to your account to continue.
                </p>
            </div>

            <Button
                className="w-full" variant="outline" type="button"
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
                        placeholder="your.email@example.com" type="email"
                        autoComplete="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputGroupAddon align="inline-start"><AtSignIcon /></InputGroupAddon>
                </InputGroup>

                <InputGroup>
                    <InputGroupInput
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputGroupAddon align="inline-start"><LockIcon /></InputGroupAddon>
                    <InputGroupAddon
                        align="inline-end" className="cursor-pointer"
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
                        href="/auth/forgot-password"
                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                    >
                        Forgot password?
                    </Link>
                </div>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 hover:text-primary">
                    Create one
                </Link>
            </p>

            <p className="text-muted-foreground text-xs text-center">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
            </p>
        </div>
    );
}
