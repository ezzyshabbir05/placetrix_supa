// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/_types.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared / primitives ───────────────────────────────────────────────────────

export interface Tag {
  id: string
  name: string
}

// ── Candidate types ───────────────────────────────────────────────────────────

export interface CandidateOption {
  id: string
  option_text: string
  order_index: number
  /** null when results are not yet released */
  is_correct: boolean | null
}

export interface CandidateAnswerDetail {
  question_id: string
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: number
  explanation: string | null
  order_index: number
  is_correct: boolean | null
  marks_awarded: number | null
  selected_option_ids: string[]
  options: CandidateOption[]
  tags: Tag[]
}

export interface CandidateAttemptDetail {
  id: string
  status: "in_progress" | "submitted"
  score: number | null
  total_marks: number | null
  percentage: number | null
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
  answers: CandidateAnswerDetail[]
}

export interface CandidateTestDetail {
  questions: any | null
  id: string
  title: string
  description: string | null
  instructions: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  results_available: boolean
  institute_name: string | null
}

// ── Institute types ───────────────────────────────────────────────────────────

export interface InstituteOption {
  id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export interface InstituteQuestion {
  id: string
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  order_index: number
  marks: number
  explanation: string | null
  options: InstituteOption[]
  tags: Tag[]
}

export interface InstituteAttemptRow {
  id: string
  student_id: string
  student_name: string | null
  student_email?: string | null
  status: "in_progress" | "submitted"
  score: number | null
  total_marks: number | null
  percentage: number | null
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
}

export interface InstituteTestDetail {
  institute_name: any
  id: string
  title: string
  description: string | null
  instructions: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  results_available: boolean
  status: "draft" | "published"
  questions: InstituteQuestion[]
  attempts: InstituteAttemptRow[]
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "No time limit"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}

export function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/** Resolve percentage: prefer stored value, else compute from score/total. */
export function resolvePct(
  percentage: number | null,
  score: number | null,
  total: number | null
): number {
  if (percentage != null) return Math.round(percentage)
  if (score != null && total != null && total > 0)
    return Math.round((score / total) * 100)
  return 0
}