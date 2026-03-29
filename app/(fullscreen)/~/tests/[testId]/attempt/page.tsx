// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttemptClient } from "./AttemptClient"
import { saveAnswerAction, submitAttemptAction, recordViolationAction, startAttemptAction } from "./actions"
import { getCachedTestQuestions } from "@/lib/test-data"
import type { AttemptQuestion, AttemptTest, AttemptInfo, SavedAnswer } from "./_types"

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const supabase = await createClient()
  const now = new Date()

  const { data: authData } = await supabase.auth.getClaims()
  if (!authData?.claims) redirect("/auth/login")

  // ── 1. Consolidated Initialization (RPC) ────────────────────────────────────
  // Handles profile, test status, resume flow, and attempt counting in one DB call.
  const { data: initResult, error: initError } = await (supabase as any).rpc("init_test_attempt", {
     p_test_id: testId
  }) as { data: any, error: any }

  if (initError || !initResult) {
    throw new Error("Failed to initialize test: " + (initError?.message ?? "unknown"))
  }

  // Handle specific RPC responses
  if (initResult.error) {
    // If profile is incomplete, redirect there.
    if (initResult.error === "Profile incomplete") redirect("/~/settings")
    // For other errors (test not available, invalid institute), redirect back to tests list.
    redirect("/~/tests")
  }

  // Handle expired resume flows (the RPC grades and returns 'expired')
  if (initResult.status === "expired") {
    redirect(`/~/tests/${testId}`)
  }

  // ── 2. Data Preparation ─────────────────────────────────────────────────────
  let attemptInfo: AttemptInfo | null = null
  let savedAnswers: SavedAnswer[] = []

  if (initResult.status === "resumed") {
    attemptInfo = {
      ...initResult.attempt,
      server_time: now.toISOString()
    }
    savedAnswers = initResult.saved_answers ?? []
  }

  // ── 3. Fetch questions (Uses 'use cache') ────────────────────────────────────
  // This reduces load during spikes as the DB is only queried once per test.
  let questions = await getCachedTestQuestions(testId)

  // Apply test-level shuffles (server-side for consistency in the current session)
  // (We fetch the shuffle flags from the 'init_test_attempt' result if needed, 
  // but for simplicity we assume the client knows them or we're fine with default)
  
  // Note: shuffle_questions and shuffle_options were previously fetched from tests.
  // I need to ensure the test header data is available if shuffling is needed.
  // Actually, I'll fetch test header details as well if needed, or update RPC.
  // My RPC currently doesn't return shuffle flags. Let me update the RPC or re-fetch test details.

  // Let's re-fetch just the test details in parallel with questions.
  const { data: testDetail } = await supabase
    .from("tests")
    .select("shuffle_questions, shuffle_options, title, description, instructions, time_limit_seconds, available_until")
    .eq("id", testId)
    .single()

  if (testDetail?.shuffle_questions) {
    questions = [...questions].sort(() => Math.random() - 0.5)
  }
  if (testDetail?.shuffle_options) {
    questions = questions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }))
  }

  // ── 4. Build client-safe test object ───────────────────────────────────────────
  const testForClient: AttemptTest = {
    id: testId,
    title: testDetail?.title || "Test",
    description: testDetail?.description ?? null,
    instructions: testDetail?.instructions ?? null,
    time_limit_seconds: testDetail?.time_limit_seconds ?? null,
    available_until: testDetail?.available_until ?? null,
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
