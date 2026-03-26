// app/~/tests/[testId]/page.tsx

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


async function fetchCandidateView(
  testId: string,
  userId: string
): Promise<{ test: CandidateTestDetail; attempt: CandidateAttemptDetail | null }> {
  const supabase = await createClient()

  // 1. Parallelize initial checks and base test data
  const [profileRes, testRes, questionsMarksRes, attemptRes] = await Promise.all([
    supabase.from("candidate_profiles").select("institute_id").eq("profile_id", userId).maybeSingle(),
    supabase.from("tests").select(`id, title, description, instructions, time_limit_seconds, available_from, available_until, results_available, status, institute_id`).eq("id", testId).single(),
    supabase.from("questions").select("marks").eq("test_id", testId),
    supabase.from("test_attempts").select("id, status, submitted_at, score, total_marks, percentage, time_spent_seconds, tab_switch_count").eq("test_id", testId).eq("student_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ])

  const candidateProfile = profileRes.data
  const raw = testRes.data
  const rawQuestions = questionsMarksRes.data
  const rawAttempt = attemptRes.data

  if (!candidateProfile?.institute_id || !raw || raw.status !== "published" || raw.institute_id !== candidateProfile.institute_id) {
    notFound()
  }

  // 2. Fetch institute name in parallel with total marks calculation
  const { data: institute } = await supabase
    .from("institute_profiles")
    .select("institute_name")
    .eq("profile_id", raw.institute_id)
    .maybeSingle()

  const allQuestionsTotalMarks = (rawQuestions ?? []).reduce((sum, q) => sum + (q.marks ?? 0), 0)

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
    total_marks: allQuestionsTotalMarks > 0 ? allQuestionsTotalMarks : (rawAttempt.total_marks ?? null),
    percentage: rawAttempt.score != null && allQuestionsTotalMarks > 0 ? Math.round((rawAttempt.score / allQuestionsTotalMarks) * 100) : (rawAttempt.percentage ?? null),
    time_spent_seconds: rawAttempt.time_spent_seconds ?? null,
    tab_switch_count: rawAttempt.tab_switch_count ?? null,
  }

  if (rawAttempt.status !== "submitted" || !raw.results_available) {
    return { test, attempt: { ...attemptBase, answers: [] } }
  }

  // 3. Fetch full questions and answers in parallel
  const [qRes, aRes] = await Promise.all([
    supabase.from("questions").select(`id, question_text, marks, explanation, order_index, options (id, option_text, is_correct, order_index), question_tags (tags (id, name))`).eq("test_id", testId).order("order_index"),
    supabase.from("attempt_answers").select("question_id, selected_option_ids, is_correct, marks_awarded, time_spent_seconds").eq("attempt_id", rawAttempt.id)
  ])

  const rawQFull = qRes.data
  const rawAnswers = aRes.data

  if (!rawQFull?.length) {
    return { test, attempt: { ...attemptBase, answers: [] } }
  }

  const answerMap: Record<string, {
    selected_option_ids: string[]
    is_correct: boolean | null
    marks_awarded: number | null
    time_spent_seconds: number | null
  }> = {}

  for (const a of rawAnswers ?? []) {
    answerMap[a.question_id] = {
      selected_option_ids: (a.selected_option_ids as string[]) ?? [],
      is_correct: a.is_correct ?? null,
      marks_awarded: a.marks_awarded ?? null,
      time_spent_seconds: a.time_spent_seconds ?? null,
    }
  }

  const answers: CandidateAnswerDetail[] = rawQFull.map((q) => {
    const ans = answerMap[q.id]
    return {
      question_id: q.id,
      question_text: q.question_text,
      marks: q.marks,
      is_correct: ans?.is_correct ?? null,
      marks_awarded: ans?.marks_awarded ?? null,
      selected_option_ids: ans?.selected_option_ids ?? [],
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


// ─── Institute data ───────────────────────────────────────────────────────────


async function fetchInstituteView(
  testId: string,
  userId: string
): Promise<InstituteTestDetail> {
  const supabase = await createClient()

  // 1. Parallelize core test, questions, attempts, and attempt info
  const [testRes, questionsRes, attemptsRes, testAttemptsInfoRes] = await Promise.all([
    supabase.from("tests").select(`id, title, description, instructions, time_limit_seconds, available_from, available_until, status, results_available, institute_id`).eq("id", testId).eq("institute_id", userId).single(),
    supabase.from("questions").select(`id, question_text, question_type, marks, order_index, explanation, options (id, option_text, is_correct, order_index), question_tags (tags (id, name))`).eq("test_id", testId).order("order_index"),
    supabase.from("attempt_details").select(`id, student_name, student_email, status, score, total_marks, percentage, time_spent_seconds, started_at, submitted_at`).eq("test_id", testId).order("started_at", { ascending: false }),
    supabase.from("test_attempts").select("id, student_id, tab_switch_count").eq("test_id", testId)
  ])

  const raw = testRes.data
  const rawQuestions = questionsRes.data
  const rawAttempts = attemptsRes.data
  const testAttemptsInfo = testAttemptsInfoRes.data

  if (!raw) notFound()

  // 2. Parallelize institute name and candidate profiles
  const studentIds = Array.from(new Set((testAttemptsInfo ?? []).map((r) => r.student_id).filter(Boolean)))

  const [instituteRes, profilesRes] = await Promise.all([
    supabase.from("institute_profiles").select("institute_name").eq("profile_id", raw.institute_id).maybeSingle(),
    supabase.from("candidate_profiles").select("profile_id, course_name, passout_year").in("profile_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])
  ])

  const institute = instituteRes.data
  const candidateProfiles = profilesRes.data

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

  const profileMap = new Map((candidateProfiles ?? []).map((p) => [p.profile_id, p]))

  const extraInfoMap = new Map((testAttemptsInfo ?? []).map((r) => [
    r.id,
    {
      tab_switch_count: r.tab_switch_count,
      branch: r.student_id ? profileMap.get(r.student_id)?.course_name ?? null : null,
      passout_year: r.student_id ? profileMap.get(r.student_id)?.passout_year ?? null : null,
    }
  ]))

  const fullTotalMarks = questions.reduce((s, q) => s + q.marks, 0)

  const attempts: InstituteAttemptRow[] = (rawAttempts ?? [])
    .filter((a): a is typeof a & { id: string; started_at: string } =>
      a.id != null && a.started_at != null
    )
    .map((a) => {
      const extra = extraInfoMap.get(a.id)
      return {
        id: a.id,
        student_name: a.student_name ?? null,
        student_email: a.student_email ?? null,
        status: a.status as InstituteAttemptRow["status"],
        score: a.score ?? null,
        total_marks: fullTotalMarks > 0 ? fullTotalMarks : (a.total_marks ?? null),
        percentage:
          a.score != null && fullTotalMarks > 0
            ? Math.round((a.score / fullTotalMarks) * 100)
            : (a.percentage ?? null),
        time_spent_seconds: a.time_spent_seconds ?? null,
        started_at: a.started_at,
        submitted_at: a.submitted_at ?? null,
        tab_switch_count: extra?.tab_switch_count ?? null,
        branch: extra?.branch ?? null,
        passout_year: extra?.passout_year ?? null,
      }
    })


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

  // ── Redirect "new" to tests list ──────────────────────────────────────────
  if (testId === "new") redirect("/~/tests")

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
        testId={testId}
        test={test}
        onToggleResults={toggleResultsAction.bind(null, testId)}
        onTogglePublish={togglePublishAction.bind(null, testId)}
        onDeleteTest={deleteTestAction.bind(null, testId)}
      />
    )
  }

  redirect("/~/tests")
}
