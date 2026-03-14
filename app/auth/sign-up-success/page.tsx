// app/auth/sign-up-success/page.tsx

import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="mx-auto space-y-4 sm:w-sm text-center">
      <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-green-500/10">
        <CheckCircleIcon className="h-7 w-7 text-green-500" />
      </div>
      <div className="space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">
          Thank you for signing up!
        </h1>
        <p className="text-base text-muted-foreground">
          Check your email to confirm your account before signing in. The
          confirmation link works from any device or browser.
        </p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/auth/login">Go to Sign In</Link>
      </Button>
    </div>
  );
}