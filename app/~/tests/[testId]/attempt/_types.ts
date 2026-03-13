// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/attempt/_types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type AttemptOption = {
  id: string
  option_text: string
  order_index: number
}

export type AttemptQuestion = {
  id: string
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  order_index: number
  marks: number
  options: AttemptOption[]
  tags: { id: string; name: string }[]
}

export type AttemptTest = {
  id: string
  title: string
  description: string | null
  instructions: string | null
  time_limit_seconds: number | null
  available_until: string | null
}

export type AttemptInfo = {
  id: string
  started_at: string
  time_spent_seconds: number | null
}

export type SavedAnswer = {
  question_id: string
  selected_option_ids: string[]
}