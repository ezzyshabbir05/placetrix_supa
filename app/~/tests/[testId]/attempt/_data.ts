// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/attempt/_data.ts
//
// All database access for the attempt flow lives here.
// The page and client components stay free of Supabase imports.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import type { AttemptTest, AttemptQuestion, AttemptInfo, SavedAnswer } from "./_types"

// ─── Test ─────────────────────────────────────────────────────────────────────

export async function getPublishedTest(testId: string): Promise<AttemptTest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tests")
    .select(
      "id, title, description, instructions, time_limit_seconds, available_from, available_until"
    )
    .eq("id", testId)
    .eq("status", "published")
    .single()

  if (error || !data) return null

  return {
    id:                 data.id,
    title:              data.title,
    description:        data.description,
    instructions:       data.instructions,
    time_limit_seconds: data.time_limit_seconds,
    available_until:    data.available_until,
  }
}

// ─── Attempts ─────────────────────────────────────────────────────────────────

export async function getSubmittedAttempt(
  testId: string,
  studentId: string
): Promise<{ id: string } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("test_attempts")
    .select("id")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .eq("status", "submitted")
    .maybeSingle()

  return data ?? null
}

export async function getOrCreateAttempt(
  testId: string,
  studentId: string
): Promise<AttemptInfo | null> {
  const supabase = await createClient()

  // Try to find an existing in_progress attempt
  const { data: existing } = await supabase
    .from("test_attempts")
    .select("id, started_at, time_spent_seconds")
    .eq("test_id", testId)
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .maybeSingle()

  if (existing) {
    return {
      id:                 existing.id,
      started_at:         existing.started_at,
      time_spent_seconds: existing.time_spent_seconds,
    }
  }

  // Create a new attempt
  const { data: created, error } = await supabase
    .from("test_attempts")
    .insert({ test_id: testId, student_id: studentId })
    .select("id, started_at, time_spent_seconds")
    .single()

  if (error || !created) return null

  return {
    id:                 created.id,
    started_at:         created.started_at,
    time_spent_seconds: created.time_spent_seconds,
  }
}

// ─── Questions ────────────────────────────────────────────────────────────────

// NOTE: `is_correct` is intentionally omitted — it must never reach the client
// during an active attempt. It is only read server-side during grading.

export async function getAttemptQuestions(testId: string): Promise<AttemptQuestion[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      question_type,
      order_index,
      marks,
      options ( id, option_text, order_index ),
      question_tags ( tags ( id, name ) )
    `)
    .eq("test_id", testId)
    .order("order_index")

  if (!data) return []

  return data.map((q) => {
    const opts = (
      q.options as unknown as { id: string; option_text: string; order_index: number }[] | null
    ) ?? []

    const tags = (
      q.question_tags as unknown as { tags: { id: string; name: string } | null }[] | null
    ) ?? []

    return {
      id:            q.id,
      question_text: q.question_text,
      question_type: q.question_type as "single_correct" | "multiple_correct",
      order_index:   q.order_index,
      marks:         q.marks,
      options:       [...opts].sort((a, b) => a.order_index - b.order_index),
      tags:          tags
        .map((qt) => qt.tags)
        .filter((t): t is { id: string; name: string } => t != null),
    }
  })
}

// ─── Saved answers ────────────────────────────────────────────────────────────

export async function getSavedAnswers(attemptId: string): Promise<SavedAnswer[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("attempt_answers")
    .select("question_id, selected_option_ids")
    .eq("attempt_id", attemptId)

  return (data ?? []).map((a) => ({
    question_id:         a.question_id,
    selected_option_ids: a.selected_option_ids ?? [],
  }))
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc("save_answer", {
    p_attempt_id:          attemptId,
    p_question_id:         questionId,
    p_selected_option_ids: selectedOptionIds,
  })

  if (error) throw new Error(error.message ?? "Failed to save answer")
}

export async function submitAttempt(
  attemptId: string,
  timeSpentSeconds: number
): Promise<void> {
  const supabase = await createClient()

  // Persist time spent — non-fatal if it fails
  await supabase
    .from("test_attempts")
    .update({ time_spent_seconds: timeSpentSeconds })
    .eq("id", attemptId)

  const { error } = await supabase.rpc("grade_attempt", {
    p_attempt_id: attemptId,
  })

  if (error) throw new Error(error.message ?? "Submission failed")
}