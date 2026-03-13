// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { CandidateTestsClient } from "./CandidateTestsClient"
import { InstituteTestsClient } from "./InstituteTestsClient"
import {
  deriveStatus,
  type CandidateTest,
  type CandidateTestAttempt,
  type InstituteTest,
} from "./_types"


// ─── Candidate data ───────────────────────────────────────────────────────────

async function fetchCandidateTests(userId: string): Promise<CandidateTest[]> {
  const supabase = await createClient()

  // 1. Resolve the candidate's institute so we only show tests they belong to.
  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("institute_id")
    .eq("profile_id", userId)
    .maybeSingle()

  // 2. Build the tests query. If no institute is linked yet, show all published
  //    tests so the page is never blank for a fresh account.
  let testsQuery = supabase
    .from("tests")
    .select(
      "id, title, description, time_limit_seconds, available_from, available_until, results_available"
    )
    .eq("status", "published")
    .order("available_from", { ascending: false })

  if (candidateProfile?.institute_id) {
    testsQuery = testsQuery.eq("institute_id", candidateProfile.institute_id)
  }

  const { data: rawTests } = await testsQuery
  if (!rawTests?.length) return []

  // 3. Fetch this candidate's attempts for the returned tests in one query.
  //    Order ascending so the first row per test_id is the EARLIEST attempt;
  //    we then keep the LATEST by iterating forward and overwriting.
  const testIds = rawTests.map((t) => t.id)

  const { data: rawAttempts } = await supabase
    .from("test_attempts")
    .select("test_id, status, submitted_at, score, total_marks, percentage")
    .eq("student_id", userId)
    .in("test_id", testIds)
    .order("created_at", { ascending: false }) // newest first

  // 4. Build a map of testId → latest attempt (first row wins because newest-first).
  const attemptMap: Record<string, CandidateTestAttempt> = {}
  for (const a of rawAttempts ?? []) {
    if (attemptMap[a.test_id]) continue // already have the latest
    attemptMap[a.test_id] = {
      status: a.status as "in_progress" | "submitted",
      submitted_at: a.submitted_at ?? undefined,
      score: a.score ?? undefined,
      total_marks: a.total_marks ?? undefined,
      percentage: a.percentage ?? undefined,
    }
  }

  // 5. Shape into CandidateTest[], deriving the display status from the window.
  return rawTests.map((t): CandidateTest => ({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    time_limit_seconds: t.time_limit_seconds ?? 0,
    available_from: t.available_from ?? undefined,
    // Candidates only ever see published tests, so "draft" is not a possibility.
    // Cast is safe because deriveStatus("published", ...) never returns "draft".
    derived_status: deriveStatus(
      "published",
      t.available_from,
      t.available_until
    ) as CandidateTest["derived_status"],
    results_available: t.results_available,
    attempt: attemptMap[t.id],
  }))
}


// ─── Institute data ───────────────────────────────────────────────────────────

async function fetchInstituteTests(userId: string): Promise<InstituteTest[]> {
  const supabase = await createClient()

  // Single query: tests + nested aggregate counts for questions and attempts.
  // PostgREST returns counts as [{ count: N }] when you select a foreign table
  // with only "count" in the column list.
  const { data: rawTests } = await supabase
    .from("tests")
    .select(
      `id, title, description, time_limit_seconds,
       available_from, available_until, status, results_available,
       questions(count),
       test_attempts(count)`
    )
    .eq("institute_id", userId)
    .order("created_at", { ascending: false })

  return (rawTests ?? []).map((t): InstituteTest => ({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    time_limit_seconds: t.time_limit_seconds ?? 0,
    available_from: t.available_from ?? undefined,
    available_until: t.available_until ?? undefined,
    derived_status: deriveStatus(t.status, t.available_from, t.available_until),
    status: t.status as "draft" | "published",
    results_available: t.results_available,
    // PostgREST aggregate: [{ count: N }]
    question_count: (t.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
    attempt_count: (t.test_attempts as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))
}


// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function TestsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    const tests = await fetchCandidateTests(profile.id)
    return <CandidateTestsClient tests={tests} />
  }

  if (profile.account_type === "institute") {
    const tests = await fetchInstituteTests(profile.id)
    return <InstituteTestsClient tests={tests} />
  }

  redirect("/~/dashboard")
}