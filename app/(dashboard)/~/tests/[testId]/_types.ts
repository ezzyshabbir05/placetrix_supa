// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/_types.ts
// ─────────────────────────────────────────────────────────────────────────────


// ─── Candidate ────────────────────────────────────────────────────────────────

export interface CandidateOption {
  id: string
  option_text: string
  is_correct: boolean | null   // null when results are hidden
  order_index: number
}

export interface CandidateAnswerDetail {
  question_id: string
  question_text: string
  marks: number
  is_correct: boolean | null
  marks_awarded: number | null
  selected_option_ids: string[]
  explanation: string | null
  options: CandidateOption[]
  tags: { id: string; name: string }[]
}

export interface CandidateAttemptDetail {
  id: string
  status: "in_progress" | "submitted"
  submitted_at: string | null
  score: number | null
  total_marks: number | null
  percentage: number | null
  time_spent_seconds: number | null
  answers: CandidateAnswerDetail[]
}

export interface CandidateTestDetail {
  id: string
  title: string
  description: string | null
  instructions: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  results_available: boolean
  institute_name: string | null
  /** Lightweight list — only marks needed for the pre-test totals display */
  questions: { marks: number }[]
}


// ─── Institute ────────────────────────────────────────────────────────────────

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
  marks: number
  order_index: number
  explanation: string | null
  options: InstituteOption[]
  tags: { id: string; name: string }[]
}

export interface InstituteAttemptRow {
  id: string
  student_name: string | null
  student_email: string | null
  status: "in_progress" | "submitted" | "abandoned" | "auto_submitted"
  score: number | null
  total_marks: number | null
  percentage: number | null
  time_spent_seconds: number | null
  started_at: string
  submitted_at: string | null
}

export interface InstituteTestDetail {
  id: string
  title: string
  description: string | null
  instructions: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  status: "draft" | "published" | "archived"
  results_available: boolean
  institute_name: string | null
  questions: InstituteQuestion[]
  attempts: InstituteAttemptRow[]
}


// ─── Shared utilities ─────────────────────────────────────────────────────────

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "Untimed"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}

export function formatDateTime(dt?: string | null): string {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

/** Resolves percentage: use DB value if present, otherwise compute from score/total. */
export function resolvePct(
  pct: number | null | undefined,
  score: number | null | undefined,
  total: number | null | undefined
): number {
  if (pct != null) return Math.round(pct)
  if (score != null && total != null && total > 0)
    return Math.round((score / total) * 100)
  return 0
}