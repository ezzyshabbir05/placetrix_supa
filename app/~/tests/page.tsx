import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { CandidateTestsClient } from "./CandidateTestsClient"
import { InstituteTestsClient } from "./InstituteTestsClient"

export default async function TestsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  // ── Candidate ──────────────────────────────────────────────────────────────
  if (profile.account_type === "candidate") {
    return <CandidateTestsClient />
  }

  if (profile.account_type === "institute") {
    return <InstituteTestsClient />
  }

  redirect("/dashboard")
}