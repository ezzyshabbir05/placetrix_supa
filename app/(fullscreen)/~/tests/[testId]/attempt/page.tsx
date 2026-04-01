// ─────────────────────────────────────────────────────────────────────────────
// app/(fullscreen)/~/tests/[testId]/attempt/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AttemptClient } from "./AttemptClient"
import {
  saveAnswerAction,
  submitAttemptAction,
  recordViolationAction,
  startAttemptAction,
} from "./actions"
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

  const { data: authData } = await supabase.auth.getClaims()
  if (!authData?.claims) redirect("/auth/login")

  // ── 1. Consolidated Initialization (RPC) ────────────────────────────────────
  const { data: initResult, error: initError } = await (supabase as any).rpc(
    "init_test_attempt",
    { p_test_id: testId }
  ) as { data: any; error: any }

  if (initError || !initResult) {
    throw new Error("Failed to initialize test: " + (initError?.message ?? "unknown"))
  }

  if (initResult.error) {
    if (initResult.error === "Profile incomplete") redirect("/~/settings")
    redirect("/~/tests")
  }

  // Capture the server timestamp immediately after the RPC returns so that
  // it reflects real server-side time rather than the pre-RPC instant.
  const serverNow = new Date()

  if (initResult.status === "expired") {
    redirect(`/~/tests/${testId}`)
  }

  // ── 2. Data Preparation ─────────────────────────────────────────────────────
  // Discriminate between a resumed attempt and a new (ready) session.
  // "ready" means the RPC confirmed the test is available but no in-progress
  // attempt exists yet — the attempt row will be created when the user clicks
  // "Begin test".
  let attemptInfo: AttemptInfo | null = null
  let savedAnswers: SavedAnswer[] = []
  let currentAttemptNumber = 1

  if (initResult.status === "resumed") {
    attemptInfo = {
      ...initResult.attempt,
      server_time: serverNow.toISOString(),
    }
    savedAnswers = initResult.saved_answers ?? []
    currentAttemptNumber = attemptInfo?.attempt_number ?? 1
  } else if (initResult.status === "ready") {
    currentAttemptNumber = (initResult.completed_count ?? 0) + 1
  } else {
    // Guard against unexpected statuses returned by future RPC versions.
    throw new Error(`Unexpected init status: ${initResult.status}`)
  }

  // ── 3. Fetch questions + test details in parallel ───────────────────────────
  const [questions, testDetailRes] = await Promise.all([
    getTestQuestions(testId),
    supabase
      .from("tests")
      .select(
        "title, description, instructions, time_limit_seconds, available_until, shuffle_questions, shuffle_options, strict_mode"
      )
      .eq("id", testId)
      .single(),
  ])

  const testDetail = testDetailRes.data

  // ── 4. Apply deterministic shuffle ──────────────────────────────────────────
  // Seed strategy:
  // We use (user.sub + testId + currentAttemptNumber) as the seed. 
  // This is stable across the intro page and the active test phase because:
  //   1. Before starting, the RPC returns the next available attempt number.
  //   2. Once started, the attempt row persists that same attempt number.
  // This prevents the question order from changing if the page is refreshed 
  // mid-test or if a server action triggers a component re-render.
  const user = authData.claims
  const shuffleSeed = seedFromUUID(`${user.sub}_${testId}_${currentAttemptNumber}`)

  let displayQuestions: AttemptQuestion[] = questions

  if (testDetail?.shuffle_questions) {
    const rng = mulberry32(shuffleSeed)
    displayQuestions = seededShuffle(displayQuestions, rng)
  }

  if (testDetail?.shuffle_options) {
    // Use a separate RNG branch per question so option order is independent
    // of question order and stable across reshuffles.
    displayQuestions = displayQuestions.map((q) => {
      const rng = mulberry32(shuffleSeed ^ seedFromUUID(q.id))
      return { ...q, options: seededShuffle(q.options, rng) }
    })
  }

  // ── 5. Build client-safe test object ────────────────────────────────────────
  const testForClient: AttemptTest = {
    id: testId,
    title: testDetail?.title ?? "Test",
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
      serverNow={serverNow.toISOString()}
      onStartAttempt={startAttemptAction.bind(null, testId)}
      onSaveAnswer={saveAnswerAction}
      onSubmit={submitAttemptAction}
      onViolation={recordViolationAction}
    />
  )
}