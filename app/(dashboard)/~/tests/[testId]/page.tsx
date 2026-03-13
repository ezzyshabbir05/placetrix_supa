// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { CandidateTestDetailClient } from "./CandidateTestDetailClient"
import { InstituteTestDetailClient } from "./InstituteTestDetailClient"
import {
  toggleResultsAction,
  togglePublishAction,
  deleteTestAction,
} from "./actions"
import type {
  CandidateTestDetail,
  CandidateAttemptDetail,
  CandidateAnswerDetail,
  CandidateOption,
  InstituteTestDetail,
  InstituteQuestion,
  InstituteAttemptRow,
} from "./_types"


// ─── Candidate data ───────────────────────────────────────────────────────────

// app/~/tests/[testId]/page.tsx  (fetchCandidateView — full replacement)

async function fetchCandidateView(
  testId: string,
  userId: string
): Promise<{ test: CandidateTestDetail; attempt: CandidateAttemptDetail | null }> {
  const supabase = await createClient()

  // 1. Fetch published test
  const { data: raw } = await supabase
    .from("tests")
    .select(
      `id, title, description, instructions, time_limit_seconds,
       available_from, available_until, results_available, status,
       institute_id`
    )
    .eq("id", testId)
    .single()

  if (!raw || raw.status !== "published") notFound()

  // 2. Institute display name
  const { data: institute } = await supabase
    .from("institute_profiles")
    .select("institute_name")
    .eq("profile_id", raw.institute_id)
    .maybeSingle()

  // 3. Lightweight question list (only marks needed pre-attempt)
  const { data: rawQuestions } = await supabase
    .from("questions")
    .select("marks")
    .eq("test_id", testId)

  // 4. Latest attempt for this student (any status)
  const { data: rawAttempt } = await supabase
    .from("test_attempts")
    .select("id, status, submitted_at, score, total_marks, percentage, time_spent_seconds")
    .eq("test_id", testId)
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const test: CandidateTestDetail = {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    instructions: raw.instructions ?? null,
    time_limit_seconds: raw.time_limit_seconds ?? null,
    available_from: raw.available_from ?? null,
    available_until: raw.available_until ?? null,
    results_available: raw.results_available,
    institute_name: institute?.institute_name ?? null,
    questions: (rawQuestions ?? []).map((q) => ({ marks: q.marks })),
  }

  if (!rawAttempt) return { test, attempt: null }

  const attemptBase = {
    id: rawAttempt.id,
    status: rawAttempt.status as "in_progress" | "submitted",
    submitted_at: rawAttempt.submitted_at ?? null,
    score: rawAttempt.score ?? null,
    total_marks: rawAttempt.total_marks ?? null,
    percentage: rawAttempt.percentage ?? null,
    time_spent_seconds: rawAttempt.time_spent_seconds ?? null,
  }

  // 5. Full answer review — only when submitted AND results released
  if (rawAttempt.status !== "submitted" || !raw.results_available) {
    return { test, attempt: { ...attemptBase, answers: [] } }
  }

  // ── FIXED: Fetch ALL questions for the test (not just answered ones) ──
  const { data: rawQFull } = await supabase
    .from("questions")
    .select(
      `id, question_text, marks, explanation, order_index,
       options (id, option_text, is_correct, order_index),
       question_tags (tags (id, name))`
    )
    .eq("test_id", testId)
    .order("order_index")

  if (!rawQFull?.length) {
    return { test, attempt: { ...attemptBase, answers: [] } }
  }

  // Fetch answers (only for questions the student interacted with)
  const { data: rawAnswers } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_ids, is_correct, marks_awarded")
    .eq("attempt_id", rawAttempt.id)

  // Build answer lookup map keyed by question_id
  const answerMap: Record<string, {
    selected_option_ids: string[]
    is_correct: boolean | null
    marks_awarded: number | null
  }> = {}

  for (const a of rawAnswers ?? []) {
    answerMap[a.question_id] = {
      selected_option_ids: (a.selected_option_ids as string[]) ?? [],
      is_correct: a.is_correct ?? null,
      marks_awarded: a.marks_awarded ?? null,
    }
  }

  // ── Build full answer list: one entry per question, skipped if no answer row ──
  const answers: CandidateAnswerDetail[] = rawQFull.map((q) => {
    const ans = answerMap[q.id]

    return {
      question_id: q.id,
      question_text: q.question_text,
      marks: q.marks,
      is_correct: ans?.is_correct ?? null,
      marks_awarded: ans?.marks_awarded ?? null,
      // Empty array = skipped
      selected_option_ids: ans?.selected_option_ids ?? [],
      explanation: (q.explanation as string) ?? null,
      options: ((q.options as any[]) ?? []).map((o) => ({
        id: o.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
        order_index: o.order_index,
      })),
      tags: ((q.question_tags as any[]) ?? [])
        .map((qt) => qt.tags)
        .filter(Boolean)
        .flat(),
    }
  })

  return { test, attempt: { ...attemptBase, answers } }
}


// ─── Institute data ───────────────────────────────────────────────────────────

async function fetchInstituteView(
  testId: string,
  userId: string
): Promise<InstituteTestDetail> {
  const supabase = await createClient()

  // 1. Test row — must belong to this institute
  const { data: raw } = await supabase
    .from("tests")
    .select(
      `id, title, description, instructions, time_limit_seconds,
       available_from, available_until, status, results_available, institute_id`
    )
    .eq("id", testId)
    .eq("institute_id", userId)
    .single()

  if (!raw) notFound()

  // 2. Institute display name
  const { data: institute } = await supabase
    .from("institute_profiles")
    .select("institute_name")
    .eq("profile_id", raw.institute_id)
    .maybeSingle()

  // 3. Questions with options + tags
  const { data: rawQuestions } = await supabase
    .from("questions")
    .select(
      `id, question_text, question_type, marks, order_index, explanation,
       options (id, option_text, is_correct, order_index),
       question_tags (tags (id, name))`
    )
    .eq("test_id", testId)
    .order("order_index")

  const questions: InstituteQuestion[] = (rawQuestions ?? []).map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as "single_correct" | "multiple_correct",
    marks: q.marks,
    order_index: q.order_index,
    explanation: (q.explanation as string) ?? null,
    options: ((q.options as any[]) ?? []).map((o) => ({
      id: o.id,
      option_text: o.option_text,
      is_correct: o.is_correct,
      order_index: o.order_index,
    })),
    tags: ((q.question_tags as any[]) ?? [])
      .map((qt) => qt.tags)
      .filter(Boolean)
      .flat(),
  }))

  // 4. Attempts — use the attempt_details view which joins student name/email
  const { data: rawAttempts } = await supabase
    .from("attempt_details")
    .select(
      `id, student_name, student_email, status,
       score, total_marks, percentage, time_spent_seconds,
       started_at, submitted_at`
    )
    .eq("test_id", testId)
    .order("started_at", { ascending: false })

  const attempts: InstituteAttemptRow[] = (rawAttempts ?? []).map((a) => ({
    id: a.id,
    student_name: a.student_name ?? null,
    student_email: a.student_email ?? null,
    status: a.status as InstituteAttemptRow["status"],
    score: a.score ?? null,
    total_marks: a.total_marks ?? null,
    percentage: a.percentage ?? null,
    time_spent_seconds: a.time_spent_seconds ?? null,
    started_at: a.started_at,
    submitted_at: a.submitted_at ?? null,
  }))

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    instructions: raw.instructions ?? null,
    time_limit_seconds: raw.time_limit_seconds ?? null,
    available_from: raw.available_from ?? null,
    available_until: raw.available_until ?? null,
    status: raw.status as "draft" | "published" | "archived",
    results_available: raw.results_available,
    institute_name: institute?.institute_name ?? null,
    questions,
    attempts,
  }
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const profile = await getUserProfile()
  if (!profile) redirect("/auth/login")

  if (profile.account_type === "candidate") {
    const { test, attempt } = await fetchCandidateView(testId, profile.id)
    return <CandidateTestDetailClient test={test} attempt={attempt} />
  }

  if (profile.account_type === "institute") {
    const test = await fetchInstituteView(testId, profile.id)
    return (
      <InstituteTestDetailClient
        test={test}
        onToggleResults={toggleResultsAction.bind(null, testId)}
        onTogglePublish={togglePublishAction.bind(null, testId)}
        onDeleteTest={deleteTestAction.bind(null, testId)}
      />
    )
  }

  redirect("/~/dashboard")
}