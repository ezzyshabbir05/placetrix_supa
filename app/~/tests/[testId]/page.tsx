// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { notFound, redirect } from "next/navigation"
import { CandidateTestDetailClient } from "./CandidateTestDetailClient"
import { InstituteTestDetailClient } from "./InstituteTestDetailClient"
import type {
  CandidateTestDetail,
  CandidateAttemptDetail,
  CandidateAnswerDetail,
  InstituteTestDetail,
  InstituteQuestion,
  InstituteAttemptRow,
} from "./_types"

// ── Candidate fetch ───────────────────────────────────────────────────────────

async function getCandidateTestData(
  testId: string,
  studentId: string
): Promise<{ test: CandidateTestDetail; attempt: CandidateAttemptDetail | null }> {
  const supabase = await createClient()

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select(`
      id, title, description, instructions,
      time_limit_seconds, available_from, available_until, results_available,
      institute_profiles ( institute_name )
    `)
    .eq("id", testId)
    .eq("status", "published")
    .single()

  if (testError || !test) notFound()

  const mappedTest: CandidateTestDetail = {
    id: test.id,
    title: test.title,
    description: test.description,
    instructions: test.instructions,
    time_limit_seconds: test.time_limit_seconds,
    available_from: test.available_from,
    available_until: test.available_until,
    results_available: test.results_available,
    institute_name:
      (test.institute_profiles as unknown as { institute_name: string } | null)
        ?.institute_name ?? null,
  }

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id, status, score, total_marks, percentage, started_at, submitted_at, time_spent_seconds")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .maybeSingle()

  if (!attempt) return { test: mappedTest, attempt: null }

  // Fetch answer breakdown only if submitted
  let answers: CandidateAnswerDetail[] = []

  if (attempt.status === "submitted") {
    const { data: rawAnswers } = await supabase
      .from("attempt_answers")
      .select(`
        question_id, selected_option_ids, is_correct, marks_awarded,
        questions (
          question_text, question_type, marks, explanation, order_index,
          question_tags ( tags ( id, name ) )
        )
      `)
      .eq("attempt_id", attempt.id)

    const questionIds = (rawAnswers ?? []).map((a) => a.question_id)

    // student_options view conditionally exposes is_correct based on results_available
    const { data: rawOptions } = await supabase
      .from("student_options")
      .select("id, question_id, option_text, order_index, is_correct")
      .in("question_id", questionIds)
      .order("order_index")

    const optionsByQuestion: Record<string, typeof rawOptions> = {}
    for (const opt of rawOptions ?? []) {
      if (!optionsByQuestion[opt!.question_id]) optionsByQuestion[opt!.question_id] = []
      optionsByQuestion[opt!.question_id]!.push(opt)
    }

    answers = (rawAnswers ?? []).map((a) => {
      const q = a.questions as unknown as {
        question_text: string
        question_type: string
        marks: number
        explanation: string | null
        order_index: number
        question_tags: { tags: { id: string; name: string }[] }[]
      }
      return {
        question_id: a.question_id,
        question_text: q.question_text,
        question_type: q.question_type as "single_correct" | "multiple_correct",
        marks: q.marks,
        explanation: q.explanation,
        order_index: q.order_index,
        is_correct: a.is_correct,
        marks_awarded: a.marks_awarded,
        selected_option_ids: a.selected_option_ids ?? [],
        options: (optionsByQuestion[a.question_id] ?? []).map((o) => ({
          id: o!.id,
          option_text: o!.option_text,
          order_index: o!.order_index,
          is_correct: o!.is_correct ?? null,
        })),
        tags: q.question_tags.flatMap((qt) => qt.tags),
      }
    })

    answers.sort((a, b) => a.order_index - b.order_index)
  }

  return {
    test: mappedTest,
    attempt: {
      id: attempt.id,
      status: attempt.status,
      score: attempt.score,
      total_marks: attempt.total_marks,
      percentage: attempt.percentage,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      time_spent_seconds: attempt.time_spent_seconds,
      answers,
    },
  }
}

// ── Institute fetch ───────────────────────────────────────────────────────────

async function getInstituteTestData(
  testId: string,
  instituteId: string
): Promise<InstituteTestDetail> {
  const supabase = await createClient()

  const { data: test, error } = await supabase
    .from("tests")
    .select(`
      id, title, description, instructions,
      time_limit_seconds, available_from, available_until,
      results_available, status
    `)
    .eq("id", testId)
    .eq("institute_id", instituteId)
    .single()

  if (error || !test) notFound()

  const { data: rawQuestions } = await supabase
    .from("questions")
    .select(`
      id, question_text, question_type, order_index, marks, explanation,
      options ( id, option_text, is_correct, order_index ),
      question_tags ( tags ( id, name ) )
    `)
    .eq("test_id", testId)
    .order("order_index")

  const questions: InstituteQuestion[] = (rawQuestions ?? []).map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as "single_correct" | "multiple_correct",
    order_index: q.order_index,
    marks: q.marks,
    explanation: q.explanation,
    options: (
      (q.options as unknown as { id: string; option_text: string; is_correct: boolean; order_index: number }[]) ?? []
    ).sort((a, b) => a.order_index - b.order_index),
    tags: (
      (q.question_tags as unknown as { tags: { id: string; name: string }[] }[]) ?? []
    ).flatMap((qt) => qt.tags),
  }))

  const { data: rawAttempts } = await supabase
    .from("test_attempts")
    .select(`
      id, student_id, status, score, total_marks, percentage,
      started_at, submitted_at, time_spent_seconds,
      profiles ( full_name )
    `)
    .eq("test_id", testId)
    .order("submitted_at", { ascending: false })

  const attempts: InstituteAttemptRow[] = (rawAttempts ?? []).map((a) => ({
    id: a.id,
    student_id: a.student_id,
    student_name: (a.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
    status: a.status,
    score: a.score,
    total_marks: a.total_marks,
    percentage: a.percentage,
    started_at: a.started_at,
    submitted_at: a.submitted_at,
    time_spent_seconds: a.time_spent_seconds,
  }))

  return {
    id: test.id,
    title: test.title,
    description: test.description,
    instructions: test.instructions,
    time_limit_seconds: test.time_limit_seconds,
    available_from: test.available_from,
    available_until: test.available_until,
    results_available: test.results_available,
    status: test.status as "draft" | "published",
    questions,
    attempts,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ testId: string }>
}

export default async function TestDetailPage({ params }: Props) {
  const { testId } = await params
  const profile = await getUserProfile()
  if (!profile) return null

  if (profile.account_type === "candidate") {
    const { test, attempt } = await getCandidateTestData(testId, profile.id)
    return <CandidateTestDetailClient test={test} attempt={attempt} />
  }

  if (profile.account_type === "institute") {
    const testDetail = await getInstituteTestData(testId, profile.id)
    return <InstituteTestDetailClient test={testDetail} />
  }

  redirect("/dashboard")
}