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
  const { data: authData } = await supabase.auth.getClaims()
  const user = authData?.claims
  if (!user) throw new Error("Unauthorized")

  // Parallelize: check profile, test details, and active attempt in one block.
  const [profileRes, testRes, existingRes] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("institute_id, profile_complete, profile_updated")
      .eq("profile_id", user.sub)
      .maybeSingle(),
    supabase
      .from("tests")
      .select("status, institute_id, time_limit_seconds, max_attempts")
      .eq("id", testId)
      .single(),
    supabase
      .from("test_attempts")
      .select("id, started_at, expires_at, tab_switch_count")
      .eq("test_id", testId)
      .eq("student_id", user.sub)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  const candidateProfile = profileRes.data
  const test = testRes.data
  const existingAttempt = existingRes.data

  if (!candidateProfile || !candidateProfile.profile_complete || !candidateProfile.profile_updated) {
    throw new Error("Profile is incomplete")
  }
  if (!test || test.status !== "published" || test.institute_id !== candidateProfile.institute_id) {
    throw new Error("Test not available")
  }

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
    .eq("student_id", user.sub)
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
      student_id: user.sub,
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

/**
 * Efficiently returns the Supabase client and user.
 * We rely on Postgres-level checks (RLS and the save_answer/grade_attempt RPCs)
 * for deep security (ownership, institute matching, status) rather than
 * doing multiple expensive sequential queries here in the server action.
 */
async function getSupabaseForAction() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getClaims()
  const user = authData?.claims
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
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
  const { supabase } = await getSupabaseForAction()

  // The save_answer RPC handles ownership and status checks internally.
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
  const { supabase, user } = await getSupabaseForAction()

  // 1. Grade the attempt first via self-guarding RPC.
  const { error: gradeError } = await supabase.rpc("grade_attempt", {
    p_attempt_id: attemptId,
  })
  if (gradeError) throw new Error(gradeError.message)

  // 2. Perform final metadata updates + resolve test_id in parallel.
  const [{ data: attemptData }] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("test_id")
      .eq("id", attemptId)
      .eq("student_id", user.sub)
      .single(),
    supabase
      .from("test_attempts")
      .update({ time_spent_seconds: timeSpentSeconds })
      .eq("id", attemptId)
      .eq("student_id", user.sub)
  ])

  redirect(attemptData?.test_id ? `/~/tests/${attemptData.test_id}` : "/~/tests")
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
  const { supabase, user } = await getSupabaseForAction()

  // Direct ownership check in the .eq() filter for high performance
  await supabase
    .from("test_attempts")
    .update({ tab_switch_count: totalCount })
    .eq("id", attemptId)
    .eq("student_id", user.sub)    // Ownership check
    .eq("status", "in_progress") // Guard
}
