// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/_types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = "single_correct" | "multiple_correct"

export type OptionBase = {
  id: string
  option_text: string
  order_index: number
}

export type Tag = {
  id: string
  name: string
}

// ── Candidate detail ──────────────────────────────────────────────────────────

export type CandidateTestDetail = {
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

export type CandidateOption = OptionBase & {
  is_correct: boolean | null // null until results_available (comes from student_options view)
}

export type CandidateAnswerDetail = {
  question_id: string
  question_text: string
  question_type: QuestionType
  marks: number
  explanation: string | null
  is_correct: boolean | null
  marks_awarded: number | null
  selected_option_ids: string[]
  options: CandidateOption[]
  tags: Tag[]
  order_index: number
}

export type CandidateAttemptDetail = {
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

// ── Institute detail ──────────────────────────────────────────────────────────

export type InstituteOption = OptionBase & {
  is_correct: boolean
}

export type InstituteQuestion = {
  id: string
  question_text: string
  question_type: QuestionType
  order_index: number
  marks: number
  explanation: string | null
  options: InstituteOption[]
  tags: Tag[]
}

export type InstituteAttemptRow = {
  id: string
  student_id: string
  student_name: string | null
  status: "in_progress" | "submitted"
  score: number | null
  total_marks: number | null
  percentage: number | null
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
}

export type InstituteTestDetail = {
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