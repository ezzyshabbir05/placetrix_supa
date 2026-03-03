// app/~/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TildePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/~/home");
  }, [router]);

  return null; // or a loading spinner while redirecting
}
