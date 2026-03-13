// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

// import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { CandidateTestsClient } from "./CandidateTestsClient"
import { InstituteTestsClient } from "./InstituteTestsClient"
// import { deriveTestStatus, type CandidateTest, type InstituteTest } from "./_types"

// ── Candidate data fetching ───────────────────────────────────────────────────


// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TestsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    return <CandidateTestsClient />
  }

  if (profile.account_type === "institute") {
    return <InstituteTestsClient />
  }

  redirect("/dashboard")
}