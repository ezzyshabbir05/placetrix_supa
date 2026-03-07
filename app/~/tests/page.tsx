// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { CandidateTestsClient } from "./CandidateTestsClient"
import { InstituteTestsClient } from "./InstituteTestsClient"
import { deriveTestStatus, type CandidateTest, type InstituteTest } from "./_types"

// ── Candidate data fetching ───────────────────────────────────────────────────

async function getCandidateTests(studentId: string): Promise<CandidateTest[]> {
  const supabase = await createClient()

  const { data: tests, error: testsError } = await supabase
    .from("tests")
    .select("id, title, description, time_limit_seconds, available_from, available_until, results_available, status")
    .eq("status", "published")
    .order("available_from", { ascending: false })

  if (testsError || !tests) return []

  const testIds = tests.map((t) => t.id)

  const { data: attempts } = await supabase
    .from("test_attempts")
    .select("id, test_id, status, score, total_marks, percentage, submitted_at")
    .eq("student_id", studentId)
    .in("test_id", testIds)

  const attemptsByTestId = Object.fromEntries(
    (attempts ?? []).map((a) => [a.test_id, a])
  )

  return tests
    .map((test) => {
      const derived = deriveTestStatus(test)
      if (derived === "draft") return null

      const attempt = attemptsByTestId[test.id] ?? null

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        time_limit_seconds: test.time_limit_seconds,
        available_from: test.available_from,
        available_until: test.available_until,
        results_available: test.results_available,
        derived_status: derived as "live" | "upcoming" | "past",
        attempt: attempt
          ? {
              id: attempt.id,
              status: attempt.status,
              score: attempt.score,
              total_marks: attempt.total_marks,
              percentage: attempt.percentage,
              submitted_at: attempt.submitted_at,
            }
          : null,
      }
    })
    .filter(Boolean) as CandidateTest[]
}

// ── Institute data fetching ───────────────────────────────────────────────────

async function getInstituteTests(instituteId: string): Promise<InstituteTest[]> {
  const supabase = await createClient()

  const { data: tests, error } = await supabase
    .from("tests")
    .select(`
      id,
      title,
      description,
      time_limit_seconds,
      available_from,
      available_until,
      status,
      results_available,
      questions(count),
      test_attempts(count)
    `)
    .eq("institute_id", instituteId)
    .order("created_at", { ascending: false })

  if (error || !tests) return []

  return tests.map((test) => ({
    id: test.id,
    title: test.title,
    description: test.description,
    time_limit_seconds: test.time_limit_seconds,
    available_from: test.available_from,
    available_until: test.available_until,
    status: test.status as "draft" | "published",
    results_available: test.results_available,
    derived_status: deriveTestStatus(test),
    question_count: (test.questions as unknown as { count: number }[])[0]?.count ?? 0,
    attempt_count: (test.test_attempts as unknown as { count: number }[])[0]?.count ?? 0,
  }))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TestsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    const tests = await getCandidateTests(profile.id)
    return <CandidateTestsClient tests={tests} />
  }

  if (profile.account_type === "institute") {
    const tests = await getInstituteTests(profile.id)
    return <InstituteTestsClient tests={tests} />
  }

  redirect("/dashboard")
}