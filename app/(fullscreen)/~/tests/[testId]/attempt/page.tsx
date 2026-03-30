// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttemptClient } from "./AttemptClient"
import { saveAnswerAction, submitAttemptAction, recordViolationAction, startAttemptAction } from "./actions"
import { getTestQuestions } from "@/lib/test-data"
import type { AttemptQuestion, AttemptTest, AttemptInfo, SavedAnswer } from "./_types"


// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
// Produces a deterministic sequence from a 32-bit seed so that question /
// option order is identical across page reloads for the same attempt.

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Derive a 32-bit integer from a UUID string. */
function seedFromUUID(uuid: string): number {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = (Math.imul(31, hash) + uuid.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

/** Fisher-Yates shuffle using a seeded RNG — returns a new array. */
function seededShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}


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
  const { data: initResult, error: initError } = await (supabase as any).rpc("init_test_attempt", {
    p_test_id: testId
  }) as { data: any, error: any }

  if (initError || !initResult) {
    throw new Error("Failed to initialize test: " + (initError?.message ?? "unknown"))
  }

  if (initResult.error) {
    if (initResult.error === "Profile incomplete") redirect("/~/settings")
    redirect("/~/tests")
  }

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

  // ── 3. Fetch questions + test details in parallel ───────────────────────────
  const [questions, testDetailRes] = await Promise.all([
    getTestQuestions(testId),
    supabase
      .from("tests")
      .select("title, description, instructions, time_limit_seconds, available_until, shuffle_questions, shuffle_options, strict_mode")
      .eq("id", testId)
      .single(),
  ])

  const testDetail = testDetailRes.data

  // ── 4. Apply deterministic shuffle ──────────────────────────────────────────
  // Use the attempt ID as seed so resume always shows the same order.
  // For new attempts (no attemptInfo yet) we use a random seed — the order will
  // be "locked in" once startAttemptAction creates the attempt (page re-renders).
  let displayQuestions: AttemptQuestion[] = questions

  const shuffleSeed = attemptInfo
    ? seedFromUUID(attemptInfo.id)
    : Math.floor(Math.random() * 0xffffffff)

  if (testDetail?.shuffle_questions) {
    const rng = mulberry32(shuffleSeed)
    displayQuestions = seededShuffle(displayQuestions, rng)
  }

  if (testDetail?.shuffle_options) {
    // Use a separate RNG branch per question so option order is independent
    displayQuestions = displayQuestions.map((q) => {
      const rng = mulberry32(shuffleSeed ^ seedFromUUID(q.id))
      return { ...q, options: seededShuffle(q.options, rng) }
    })
  }

  // ── 5. Build client-safe test object ────────────────────────────────────────
  const testForClient: AttemptTest = {
    id: testId,
    title: testDetail?.title || "Test",
    description: testDetail?.description ?? null,
    instructions: testDetail?.instructions ?? null,
    time_limit_seconds: testDetail?.time_limit_seconds ?? null,
    available_until: testDetail?.available_until ?? null,
    strict_mode: testDetail?.strict_mode ?? false,
    shuffle_questions: testDetail?.shuffle_questions ?? false,
    shuffle_options: testDetail?.shuffle_options ?? false,
  }

  return (
    <AttemptClient
      test={testForClient}
      questions={displayQuestions}
      attemptInfo={attemptInfo}
      savedAnswers={savedAnswers}
      serverNow={now.toISOString()}
      onStartAttempt={startAttemptAction.bind(null, testId)}
      onSaveAnswer={saveAnswerAction}
      onSubmit={submitAttemptAction}
      onViolation={recordViolationAction}
    />
  )
}
