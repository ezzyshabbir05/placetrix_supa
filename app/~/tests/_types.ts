// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/_types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type DerivedStatus = "live" | "upcoming" | "past"
export type InstituteTestStatus = "live" | "upcoming" | "past" | "draft"

// ── Candidate ────────────────────────────────────────────────────────────────

export type CandidateTest = {
  id: string
  title: string
  description: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  results_available: boolean
  derived_status: DerivedStatus
  attempt: {
    id: string
    status: "in_progress" | "submitted"
    score: number | null
    total_marks: number | null
    percentage: number | null
    submitted_at: string | null
  } | null
}

// ── Institute ─────────────────────────────────────────────────────────────────

export type InstituteTest = {
  id: string
  title: string
  description: string | null
  time_limit_seconds: number | null
  available_from: string | null
  available_until: string | null
  status: "draft" | "published"
  results_available: boolean
  derived_status: InstituteTestStatus
  question_count: number
  attempt_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function deriveTestStatus(test: {
  status: string
  available_from: string | null
  available_until: string | null
}): InstituteTestStatus {
  if (test.status === "draft") return "draft"
  const now = new Date()
  const from = test.available_from ? new Date(test.available_from) : null
  const until = test.available_until ? new Date(test.available_until) : null
  if (from && from > now) return "upcoming"
  if (until && until < now) return "past"
  return "live"
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "Untimed"
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}