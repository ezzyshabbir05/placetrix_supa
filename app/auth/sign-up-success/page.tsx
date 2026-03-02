// app/auth/sign-up-success/page.tsx
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="mx-auto space-y-4 sm:w-sm text-center">
      <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
      <div className="space-y-1">
        <h1 className="font-bold text-2xl tracking-wide">Thank you for signing up!</h1>
        <p className="text-base text-muted-foreground">
          Check your email to confirm your account before signing in.
        </p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/auth/login">Go to Sign In</Link>
      </Button>
    </div>
  );
}
