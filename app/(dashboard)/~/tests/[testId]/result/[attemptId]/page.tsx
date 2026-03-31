// app/~/tests/[testId]/result/[attemptId]/page.tsx

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { TestResultClient } from "./TestResultClient"
import type {
  CandidateTestDetail,
  CandidateAttemptDetail,
  CandidateAnswerDetail,
} from "../../_types"


async function fetchResultData(
  testId: string,
  attemptId: string,
  userId: string,
  accountType: "candidate" | "institute"
): Promise<{ test: CandidateTestDetail; attempt: CandidateAttemptDetail }> {
  const supabase = await createClient()

  // 1. Fetch the test and the specific attempt with its answers
  const { data: raw, error } = await supabase
    .from("tests")
    .select(`
      id, title, description, instructions, time_limit_seconds, 
      available_from, available_until, results_available, status, institute_id,
      shuffle_questions, shuffle_options,
      institute:institute_profiles(institute_name),
      questions (
        id, question_text, marks, explanation, order_index,
        options (id, option_text, is_correct, order_index),
        question_tags (tags (id, name))
      ),
      test_attempts!inner (
        id, student_id, status, submitted_at, score, total_marks, percentage, 
        time_spent_seconds, tab_switch_count,
        student:profiles(display_name),
        attempt_answers (
          question_id, selected_option_ids, is_correct, marks_awarded, time_spent_seconds
        )
      )
    `)
    .eq("id", testId)
    .eq("test_attempts.id", attemptId)
    .single()

  if (error || !raw) notFound()

  // 2. Security Check
  if (accountType === "candidate") {
    // Candidates can only see their own attempts
    if (raw.test_attempts[0].student_id !== userId) {
      notFound()
    }
  } else {
    // Institutes can only see attempts for their own tests
    if (raw.institute_id !== userId) {
      notFound()
    }
  }

  // 3. Map Data
  const test: CandidateTestDetail = {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    instructions: raw.instructions ?? null,
    time_limit_seconds: raw.time_limit_seconds ?? null,
    available_from: raw.available_from ?? null,
    available_until: raw.available_until ?? null,
    results_available: raw.results_available,
    shuffle_questions: raw.shuffle_questions,
    shuffle_options: raw.shuffle_options,
    institute_name: (raw.institute as any)?.institute_name ?? null,
    questions: (raw.questions ?? []).map((q: any) => ({ marks: q.marks })),
  }

  const rawAttempt = raw.test_attempts[0]
  const student = (rawAttempt as any).student
  const studentName = student?.display_name ?? null

  const attemptBase = {
    id: rawAttempt.id,
    status: rawAttempt.status as "in_progress" | "submitted",
    submitted_at: rawAttempt.submitted_at ?? null,
    score: rawAttempt.score ?? null,
    total_marks: rawAttempt.total_marks ?? null,
    percentage: rawAttempt.percentage ?? null,
    time_spent_seconds: rawAttempt.time_spent_seconds ?? null,
    tab_switch_count: rawAttempt.tab_switch_count ?? null,
    student_name: studentName,
  }

  const answerMap: Record<string, any> = {}
  for (const a of rawAttempt.attempt_answers ?? []) {
    answerMap[a.question_id] = a
  }

  const answers: CandidateAnswerDetail[] = (raw.questions ?? []).map((q: any) => {
    const ans = answerMap[q.id]
    return {
      question_id: q.id,
      question_text: q.question_text,
      marks: q.marks,
      is_correct: ans?.is_correct ?? null,
      marks_awarded: ans?.marks_awarded ?? null,
      selected_option_ids: (ans?.selected_option_ids as string[]) ?? [],
      time_spent_seconds: ans?.time_spent_seconds ?? null,
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

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>
}) {
  const { testId, attemptId } = await params
  const profile = await getUserProfile()

  if (!profile) redirect("/auth/login")

  const { test, attempt } = await fetchResultData(
    testId,
    attemptId,
    profile.id,
    profile.account_type as "candidate" | "institute"
  )

  return (
    <TestResultClient
      test={test}
      attempt={attempt}
      accountType={profile.account_type as "candidate" | "institute"}
    />
  )
}
