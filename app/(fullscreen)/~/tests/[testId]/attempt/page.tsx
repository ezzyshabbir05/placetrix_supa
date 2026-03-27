// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttemptClient } from "./AttemptClient"
import { saveAnswerAction, submitAttemptAction, recordViolationAction, startAttemptAction } from "./actions"
import type { AttemptQuestion, AttemptTest, AttemptInfo, SavedAnswer } from "./_types"

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  if (!user) redirect("/auth/login")

  // ── Parallelize initial verification & test metadata ──────────────────────
  const [profileRes, candidateRes, testRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.sub)
      .single(),
    supabase
      .from("candidate_profiles")
      .select("institute_id, profile_complete, profile_updated")
      .eq("profile_id", user.sub)
      .maybeSingle(),
    supabase
      .from("tests")
      .select(`
        id, title, description, instructions, time_limit_seconds,
        available_from, available_until, status,
        shuffle_questions, shuffle_options, max_attempts, institute_id
      `)
      .eq("id", testId)
      .single()
  ])

  const profile = profileRes.data
  const candidateProfile = candidateRes.data
  const test = testRes.data

  if (profile?.account_type !== "candidate") {
    redirect("/~/home")
  }

  if (
    !candidateProfile ||
    !candidateProfile.profile_complete ||
    !candidateProfile.profile_updated
  ) {
    redirect("/~/settings")
  }

  if (!candidateProfile.institute_id) {
    redirect("/~/tests")
  }

  if (!test || test.status !== "published" || test.institute_id !== candidateProfile.institute_id) {
    notFound()
  }

  // ── Availability window ─────────────────────────────────────────────────────
  const now = new Date()
  if (test.available_from && new Date(test.available_from) > now) {
    redirect("/~/tests")
  }
  if (test.available_until && new Date(test.available_until) < now) {
    redirect("/~/tests")
  }

  // ── Resolve or check max attempts ───────────────────────────────────────────
  let attemptInfo: AttemptInfo | null = null
  let savedAnswers: SavedAnswer[] = []

  // Look for an existing in-progress attempt first (resume flow)
  const { data: existingAttempt } = await supabase
    .from("test_attempts")
    .select("id, started_at, expires_at, tab_switch_count")
    .eq("test_id", testId)
    .eq("student_id", user.sub)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAttempt) {
    // Timer expired server-side — auto-grade and redirect back to test page
    if (
      existingAttempt.expires_at &&
      new Date(existingAttempt.expires_at) < now
    ) {
      await supabase.rpc("grade_attempt", { p_attempt_id: existingAttempt.id })
      redirect(`/~/tests/${testId}`)
    }

    attemptInfo = {
      id: existingAttempt.id,
      started_at: existingAttempt.started_at,
      server_time: now.toISOString(),
      expires_at: existingAttempt.expires_at,
      tab_switch_count: existingAttempt.tab_switch_count ?? 0,
    }

    // ── Fetch saved answers (resume support) ────────────────────────────────────
    const { data: rawAnswers } = await supabase
      .from("attempt_answers")
      .select("question_id, selected_option_ids")
      .eq("attempt_id", attemptInfo.id)

    savedAnswers = (rawAnswers ?? []).map((a) => ({
      question_id: a.question_id,
      selected_option_ids: (a.selected_option_ids as string[]) ?? [],
    }))
  } else {
    // Count completed attempts to enforce max_attempts BEFORE intro screen
    const { count: completedCount } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("test_id", testId)
      .eq("student_id", user.sub)
      .in("status", ["submitted", "auto_submitted"])

    if ((completedCount ?? 0) >= test.max_attempts) {
      redirect(`/~/tests/${testId}`)
    }
  }

  // ── Fetch questions with options & tags ─────────────────────────────────────
  const { data: rawQuestions, error: qError } = await supabase
    .from("questions")
    .select(
      `id, question_text, question_type, marks, order_index,
       options (id, option_text, order_index),
       question_tags (
         tags (id, name)
       )`
    )
    .eq("test_id", testId)
    .order("order_index")

  if (qError || !rawQuestions) {
    throw new Error("Failed to load questions: " + (qError?.message ?? "unknown"))
  }

  // Shape into the client-friendly type
  let questions: AttemptQuestion[] = rawQuestions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as "single_correct" | "multiple_correct",
    marks: q.marks,
    order_index: q.order_index,
    options: ((q.options as any[]) ?? [])
      .map((o) => ({
        id: o.id,
        option_text: o.option_text,
        order_index: o.order_index,
      }))
      .sort((a, b) => a.order_index - b.order_index),
    tags: ((q.question_tags as any[]) ?? [])
      .map((qt) => qt.tags)
      .filter(Boolean)
      .flat(),
  }))

  // Apply test-level shuffles (server-side so every student session is consistent)
  // (In a highly robust app, these random orders might be persisted per attempt, but we just use the default array matching)
  if (test.shuffle_questions) {
    questions = [...questions].sort(() => Math.random() - 0.5)
  }
  if (test.shuffle_options) {
    questions = questions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }))
  }

  // ── Build client-safe test object ───────────────────────────────────────────
  const testForClient: AttemptTest = {
    id: test.id,
    title: test.title,
    description: test.description ?? null,
    instructions: test.instructions ?? null,
    time_limit_seconds: test.time_limit_seconds ?? null,
    available_until: test.available_until ?? null,
  }

  return (
    <AttemptClient
      test={testForClient}
      questions={questions}
      attemptInfo={attemptInfo}
      savedAnswers={savedAnswers}
      onStartAttempt={startAttemptAction.bind(null, testId)}
      onSaveAnswer={saveAnswerAction}
      onSubmit={submitAttemptAction}
      onViolation={recordViolationAction}
    />
  )
}
