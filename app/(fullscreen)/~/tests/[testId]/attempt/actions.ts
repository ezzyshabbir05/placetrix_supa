"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// ─── Save Answer ───────────────────────────────────────────────────────────────
//
// Delegates to the save_answer RPC which:
//   • Verifies the caller owns the attempt and it is still in_progress
//   • Upserts the answer row (attempt_id, question_id) so it is idempotent
// ──────────────────────────────────────────────────────────────────────────────

export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc("save_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option_ids: selectedOptionIds,
    p_time_spent_seconds: 0,
  })

  if (error) throw new Error(error.message)
}


// ─── Submit Attempt ────────────────────────────────────────────────────────────
//
// 1. Persists final time_spent_seconds.
// 2. Calls grade_attempt RPC which scores every answer and marks the attempt
//    as submitted.
// 3. Redirects to the results page — Next.js propagates this redirect to the
//    browser automatically even when the action is called from a Client Component.
// ──────────────────────────────────────────────────────────────────────────────

export async function submitAttemptAction(
  attemptId: string,
  timeSpentSeconds: number
): Promise<void> {
  const supabase = await createClient()

  // Persist time spent (best-effort — do not throw on failure)
  await supabase
    .from("test_attempts")
    .update({ time_spent_seconds: timeSpentSeconds })
    .eq("id", attemptId)

  // Grade + mark as submitted
  const { error } = await supabase.rpc("grade_attempt", {
    p_attempt_id: attemptId,
  })

  if (error) throw new Error(error.message)

  // Resolve test_id for redirect
  const { data } = await supabase
    .from("test_attempts")
    .select("test_id")
    .eq("id", attemptId)
    .single()

  if (data?.test_id) {
    redirect(`/~/tests/${data.test_id}/results/${attemptId}`)
  }
}


// ─── Record Violation ──────────────────────────────────────────────────────────
//
// Keeps the attempt's tab_switch_count in sync with the client-side violation
// counter so the dashboard can audit anti-cheat events.
// This is fire-and-forget: failures are silently swallowed on the client side.
// ──────────────────────────────────────────────────────────────────────────────

export async function recordViolationAction(
  attemptId: string,
  _type: "focus_loss" | "fullscreen_exit",
  totalCount: number,
  _timestamp: string
): Promise<void> {
  const supabase = await createClient()

  // Unconditionally set the count (idempotent if the same value is written twice)
  await supabase
    .from("test_attempts")
    .update({ tab_switch_count: totalCount })
    .eq("id", attemptId)
    .eq("status", "in_progress") // guard: don't touch already-submitted attempts
}