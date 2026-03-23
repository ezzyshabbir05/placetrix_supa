// app/~/tests/page.tsx

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

export const metadata = {
  title: "Tests",
  description: "Mock Tests",
}
// ─── Candidate data ───────────────────────────────────────────────────────────

async function fetchCandidateTests(userId: string): Promise<CandidateTest[]> {
  const supabase = await createClient()

  // 1. Resolve the candidate's institute
  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("institute_id")
    .eq("profile_id", userId)
    .maybeSingle()

  // 2. Fetch published tests
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

  const testIds = rawTests.map((t) => t.id)

  // 3. Fetch this candidate's latest attempt per test
  const { data: rawAttempts } = await supabase
    .from("test_attempts")
    .select("test_id, status, submitted_at, score, total_marks, percentage")
    .eq("student_id", userId)
    .in("test_id", testIds)
    .order("created_at", { ascending: false }) // newest first

  // 4. Build a raw attempt map (score only — total_marks will be overridden below)
  const rawAttemptMap: Record<string, {
    status: "in_progress" | "submitted"
    submitted_at?: string
    score?: number
    percentage?: number
  }> = {}
  for (const a of rawAttempts ?? []) {
    if (rawAttemptMap[a.test_id]) continue // already have the latest
    rawAttemptMap[a.test_id] = {
      status: a.status as "in_progress" | "submitted",
      submitted_at: a.submitted_at ?? undefined,
      score: a.score ?? undefined,
      percentage: a.percentage ?? undefined,
    }
  }

  // 5. FIX: Fetch all questions' marks for these tests in one query,
  //    so total_marks is based on ALL questions, not just attempted ones.
  const { data: rawQuestions } = await supabase
    .from("questions")
    .select("test_id, marks")
    .in("test_id", testIds)

  // Build a map of testId → total marks across ALL questions
  const totalMarksMap: Record<string, number> = {}
  for (const q of rawQuestions ?? []) {
    totalMarksMap[q.test_id] = (totalMarksMap[q.test_id] ?? 0) + (q.marks ?? 0)
  }

  // 6. Shape into CandidateTest[], with corrected total_marks and percentage
  return rawTests.map((t): CandidateTest => {
    const raw = rawAttemptMap[t.id]
    const fullTotalMarks = totalMarksMap[t.id] ?? 0

    let attempt: CandidateTestAttempt | undefined
    if (raw) {
      // Recalculate percentage using the full question set total
      const correctedPct =
        raw.score != null && fullTotalMarks > 0
          ? Math.round((raw.score / fullTotalMarks) * 100)
          : raw.percentage

      attempt = {
        status: raw.status,
        submitted_at: raw.submitted_at,
        score: raw.score,
        // FIX: always use the sum of all questions' marks as denominator
        total_marks: fullTotalMarks > 0 ? fullTotalMarks : undefined,
        percentage: correctedPct,
      }
    }

    return {
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      time_limit_seconds: t.time_limit_seconds ?? 0,
      available_from: t.available_from ?? undefined,
      derived_status: deriveStatus(
        "published",
        t.available_from,
        t.available_until
      ) as CandidateTest["derived_status"],
      results_available: t.results_available,
      attempt,
    }
  })
}


// ─── Institute data ───────────────────────────────────────────────────────────

async function fetchInstituteTests(userId: string): Promise<InstituteTest[]> {
  const supabase = await createClient()

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
    question_count: (t.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
    attempt_count: (t.test_attempts as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))
}


// ─── Page ─────────────────────────────────────────────────────────────────────

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

  redirect("/~/tests")
}
