// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttemptClient } from "./AttemptClient"
import { saveAnswerAction, submitAttemptAction, recordViolationAction } from "./actions"
import type { AttemptQuestion, AttemptTest, AttemptInfo, SavedAnswer } from "./_types"


export default async function AttemptPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // ── Fetch published test ────────────────────────────────────────────────────
  const { data: test } = await supabase
    .from("tests")
    .select(
      `id, title, description, instructions, time_limit_seconds,
       available_from, available_until, status,
       shuffle_questions, shuffle_options, max_attempts`
    )
    .eq("id", testId)
    .single()

  if (!test || test.status !== "published") notFound()

  // ── Availability window ─────────────────────────────────────────────────────
  const now = new Date()
  if (test.available_from && new Date(test.available_from) > now) {
    redirect("/~/tests")
  }
  if (test.available_until && new Date(test.available_until) < now) {
    redirect("/~/tests")
  }

  // ── Resolve or create attempt ───────────────────────────────────────────────

  let attemptInfo: AttemptInfo

  // Look for an existing in-progress attempt first (resume flow)
  const { data: existingAttempt } = await supabase
    .from("test_attempts")
    .select("id, started_at, expires_at")
    .eq("test_id", testId)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAttempt) {
    // Timer expired server-side — auto-grade and redirect to results
    if (
      existingAttempt.expires_at &&
      new Date(existingAttempt.expires_at) < now
    ) {
      await supabase.rpc("grade_attempt", { p_attempt_id: existingAttempt.id })
      redirect(`/~/tests/${testId}/results/${existingAttempt.id}`)
    }

    attemptInfo = {
      id: existingAttempt.id,
      started_at: existingAttempt.started_at,
    }
  } else {
    // Count completed attempts to enforce max_attempts
    const { count: completedCount } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("test_id", testId)
      .eq("student_id", user.id)
      .in("status", ["submitted", "auto_submitted"])

    if ((completedCount ?? 0) >= test.max_attempts) {
      // Send student directly to their latest result
      const { data: latestAttempt } = await supabase
        .from("test_attempts")
        .select("id")
        .eq("test_id", testId)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      redirect(
        latestAttempt
          ? `/~/tests/${testId}/results/${latestAttempt.id}`
          : "/~/tests"
      )
    }

    // Create a fresh attempt
    const attemptNumber = (completedCount ?? 0) + 1
    const expiresAt = test.time_limit_seconds
      ? new Date(now.getTime() + test.time_limit_seconds * 1000).toISOString()
      : null

    const { data: newAttempt, error: createError } = await supabase
      .from("test_attempts")
      .insert({
        test_id: testId,
        student_id: user.id,
        attempt_number: attemptNumber,
        expires_at: expiresAt,
      })
      .select("id, started_at")
      .single()

    if (createError || !newAttempt) {
      throw new Error("Failed to start attempt: " + (createError?.message ?? "unknown"))
    }

    attemptInfo = { id: newAttempt.id, started_at: newAttempt.started_at }
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
  if (test.shuffle_questions) {
    questions = [...questions].sort(() => Math.random() - 0.5)
  }
  if (test.shuffle_options) {
    questions = questions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }))
  }

  // ── Fetch saved answers (resume support) ────────────────────────────────────
  const { data: rawAnswers } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_ids")
    .eq("attempt_id", attemptInfo.id)

  const savedAnswers: SavedAnswer[] = (rawAnswers ?? []).map((a) => ({
    question_id: a.question_id,
    selected_option_ids: (a.selected_option_ids as string[]) ?? [],
  }))

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
      onSaveAnswer={saveAnswerAction}
      onSubmit={submitAttemptAction}
      onViolation={recordViolationAction}
    />
  )
}