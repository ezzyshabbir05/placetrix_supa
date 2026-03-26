"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { AttemptInfo } from "./_types"

// ─── Start Attempt ────────────────────────────────────────────────────────────
// Creates a new attempt only when the user clicks 'Begin Test'
// ──────────────────────────────────────────────────────────────────────────────
export async function startAttemptAction(testId: string): Promise<AttemptInfo> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("institute_id, profile_complete, profile_updated")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (!candidateProfile || !candidateProfile.profile_complete || !candidateProfile.profile_updated) {
    throw new Error("Profile is incomplete")
  }

  const { data: test } = await supabase
    .from("tests")
    .select("status, institute_id, time_limit_seconds, max_attempts")
    .eq("id", testId)
    .single()

  if (!test || test.status !== "published" || test.institute_id !== candidateProfile.institute_id) {
    throw new Error("Test not available")
  }

  const { data: existingAttempt } = await supabase
    .from("test_attempts")
    .select("id, started_at, expires_at, tab_switch_count")
    .eq("test_id", testId)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAttempt) {
    return {
      id: existingAttempt.id,
      started_at: existingAttempt.started_at,
      server_time: new Date().toISOString(),
      expires_at: existingAttempt.expires_at,
      tab_switch_count: existingAttempt.tab_switch_count ?? 0
    }
  }

  const { count: completedCount } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId)
    .eq("student_id", user.id)
    .in("status", ["submitted", "auto_submitted"])

  if ((completedCount ?? 0) >= test.max_attempts) {
    throw new Error("Max attempts reached")
  }

  const attemptNumber = (completedCount ?? 0) + 1
  const expiresAt = test.time_limit_seconds
    ? new Date(Date.now() + test.time_limit_seconds * 1000).toISOString()
    : null

  const { data: newAttempt, error } = await supabase
    .from("test_attempts")
    .insert({
      test_id: testId,
      student_id: user.id,
      attempt_number: attemptNumber,
      expires_at: expiresAt,
    })
    .select("id, started_at")
    .single()

  if (error || !newAttempt) throw new Error("Failed to start attempt")

  return {
    id: newAttempt.id,
    started_at: newAttempt.started_at,
    server_time: new Date().toISOString(),
    expires_at: expiresAt,
    tab_switch_count: 0
  }
}



// ─── Verification ──────────────────────────────────────────────────────────────

async function verifyAttemptAccess(attemptId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("student_id, test_id")
    .eq("id", attemptId)
    .single()
  
  if (!attempt || attempt.student_id !== user.id) {
    throw new Error("Unauthorized: attempt ownership mismatch")
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("institute_id, profile_complete, profile_updated")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (!candidateProfile || !candidateProfile.profile_complete || !candidateProfile.profile_updated) {
    throw new Error("Forbidden: Profile incomplete")
  }

  if (!candidateProfile.institute_id) {
    throw new Error("Forbidden: No institute assigned")
  }

  const { data: test } = await supabase
    .from("tests")
    .select("institute_id")
    .eq("id", attempt.test_id)
    .single()

  if (!test || test.institute_id !== candidateProfile.institute_id) {
    throw new Error("Forbidden: Institute mismatch")
  }

  return supabase
}


// ─── Save Answer ───────────────────────────────────────────────────────────────
//
// Delegates to the save_answer RPC which:
//   • Verifies the caller owns the attempt and it is still in_progress
//   • Upserts the answer row (attempt_id, question_id) so it is idempotent
// ──────────────────────────────────────────────────────────────────────────────

export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
  timeSpentSeconds: number = 0
): Promise<void> {
  const supabase = await verifyAttemptAccess(attemptId)

  const { error } = await supabase.rpc("save_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option_ids: selectedOptionIds,
    p_time_spent_seconds: timeSpentSeconds,
  })

  if (error) throw new Error(error.message)
}

// ─── Submit Attempt ────────────────────────────────────────────────────────────
//
// 1. Persists final time_spent_seconds.
// 2. Calls grade_attempt RPC which scores every answer and marks the attempt
//    as submitted.
// 3. Redirects back to the test page.
// ──────────────────────────────────────────────────────────────────────────────

export async function submitAttemptAction(
  attemptId: string,
  timeSpentSeconds: number
): Promise<void> {
  const supabase = await verifyAttemptAccess(attemptId)

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

  redirect(data?.test_id ? `/~/tests/${data.test_id}` : "/~/tests")
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
  const supabase = await verifyAttemptAccess(attemptId)

  // Unconditionally set the count (idempotent if the same value is written twice)
  await supabase
    .from("test_attempts")
    .update({ tab_switch_count: totalCount })
    .eq("id", attemptId)
    .eq("status", "in_progress") // guard: don't touch already-submitted attempts
}
