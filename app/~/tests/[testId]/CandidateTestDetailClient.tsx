"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/CandidateTestDetailClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  Circle,
  CalendarClock,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Lock,
  BookOpen,
  Tag,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  CandidateTestDetail,
  CandidateAttemptDetail,
  CandidateAnswerDetail,
} from "./_types"
import { formatDuration, formatDateTime } from "../_types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number | null): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function scoreColor(pct: number): string {
  if (pct >= 75) return "text-green-600"
  if (pct >= 50) return "text-amber-600"
  return "text-red-500"
}

function scoreRingColor(pct: number): string {
  if (pct >= 75) return "stroke-green-500"
  if (pct >= 50) return "stroke-amber-500"
  return "stroke-red-500"
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor"
          strokeWidth="8" className="text-muted/30" />
        <circle cx="50" cy="50" r={r} fill="none"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={scoreRingColor(pct)} />
      </svg>
      <div className="flex flex-col items-center">
        <span className={cn("text-2xl font-bold tabular-nums", scoreColor(pct))}>
          {pct}%
        </span>
      </div>
    </div>
  )
}

// ─── Question Review Card ─────────────────────────────────────────────────────

function QuestionReviewCard({
  answer,
  index,
  resultsAvailable,
}: {
  answer: CandidateAnswerDetail
  index: number
  resultsAvailable: boolean
}) {
  const isAnswered = answer.selected_option_ids.length > 0
  const showResult = resultsAvailable && answer.is_correct !== null

  const statusIcon = showResult
    ? answer.is_correct
      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      : <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    : !isAnswered
    ? <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
    : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />

  return (
    <AccordionItem value={answer.question_id} className="border rounded-lg px-1 data-[state=open]:bg-muted/20">
      <AccordionTrigger className="px-3 py-3 hover:no-underline gap-3 [&>svg]:shrink-0">
        <div className="flex items-center gap-3 min-w-0 text-left">
          {statusIcon}
          <span className="text-xs text-muted-foreground shrink-0">Q{index + 1}</span>
          <span className="text-sm font-medium leading-snug line-clamp-2">
            {answer.question_text}
          </span>
          {showResult && (
            <Badge
              variant="outline"
              className={cn(
                "ml-auto shrink-0 text-xs",
                answer.is_correct
                  ? "border-green-500 text-green-600"
                  : "border-red-400 text-red-500"
              )}
            >
              {answer.marks_awarded ?? 0}/{answer.marks} pts
            </Badge>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-3 pb-4 space-y-3">
        {/* Options */}
        <div className="space-y-2">
          {answer.options.map((opt) => {
            const isSelected = answer.selected_option_ids.includes(opt.id)
            const isCorrect = opt.is_correct

            let optClass = "border-border bg-background text-foreground"
            let icon = null

            if (resultsAvailable && isCorrect !== null) {
              if (isCorrect && isSelected) {
                optClass = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                icon = <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              } else if (isCorrect && !isSelected) {
                optClass = "border-green-400/60 bg-green-50/50 dark:bg-green-950/20 text-green-600 dark:text-green-500"
                icon = <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              } else if (!isCorrect && isSelected) {
                optClass = "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                icon = <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              }
            } else if (isSelected) {
              optClass = "border-primary bg-primary/5 text-primary"
            }

            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
                  optClass
                )}
              >
                {icon ?? (
                  <div className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full border-2",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )} />
                )}
                <span>{opt.option_text}</span>
                {isSelected && !resultsAvailable && (
                  <Badge variant="secondary" className="ml-auto text-xs">Your answer</Badge>
                )}
              </div>
            )
          })}
        </div>

        {/* Tags */}
        {answer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {answer.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs px-2 py-0.5">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Explanation */}
        {resultsAvailable && answer.explanation && (
          <div className="flex gap-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">{answer.explanation}</p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

// ─── Score Summary ────────────────────────────────────────────────────────────

function ScoreSummary({ attempt }: { attempt: CandidateAttemptDetail }) {
  if (attempt.score == null || attempt.total_marks == null) return null
  const pct = attempt.percentage ?? Math.round((attempt.score / attempt.total_marks) * 100)
  const correct = attempt.answers.filter((a) => a.is_correct === true).length
  const wrong   = attempt.answers.filter((a) => a.is_correct === false).length
  const skipped = attempt.answers.filter((a) => a.selected_option_ids.length === 0).length

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing pct={pct} />

          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Score</span>
              <span className="font-semibold">
                {attempt.score} / {attempt.total_marks}
              </span>
            </div>
            <Progress value={pct} className="h-2" />

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center gap-0.5 rounded-md bg-green-50 dark:bg-green-950/30 p-2.5">
                <span className="text-lg font-bold text-green-600">{correct}</span>
                <span className="text-xs text-muted-foreground">Correct</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-md bg-red-50 dark:bg-red-950/30 p-2.5">
                <span className="text-lg font-bold text-red-500">{wrong}</span>
                <span className="text-xs text-muted-foreground">Wrong</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 p-2.5">
                <span className="text-lg font-bold text-muted-foreground">{skipped}</span>
                <span className="text-xs text-muted-foreground">Skipped</span>
              </div>
            </div>
          </div>
        </div>

        {attempt.time_spent_seconds != null && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Time spent: <span className="font-medium text-foreground">{formatSeconds(attempt.time_spent_seconds)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  test: CandidateTestDetail
  attempt: CandidateAttemptDetail | null
}

export function CandidateTestDetailClient({ test, attempt }: Props) {
  const isSubmitted  = attempt?.status === "submitted"
  const isInProgress = attempt?.status === "in_progress"
  const now = new Date()
  const isLive =
    (!test.available_from || new Date(test.available_from) <= now) &&
    (!test.available_until || new Date(test.available_until) >= now)

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

        {/* Back */}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="../tests">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Tests
          </Link>
        </Button>

        {/* Header */}
        <div className="space-y-2">
          {test.institute_name && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {test.institute_name}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight">{test.title}</h1>
          {test.description && (
            <p className="text-muted-foreground text-sm">{test.description}</p>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(test.time_limit_seconds)}
            </span>
            {test.available_from && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDateTime(test.available_from)}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* ── NOT ATTEMPTED ── */}
        {!attempt && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {test.instructions && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4" />Instructions
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {test.instructions}
                  </p>
                </div>
              )}
              {isLive ? (
                <Button asChild>
                  <Link href={`${test.id}/attempt`}>
                    <PlayCircle className="h-4 w-4 mr-2" />Start Test
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />This test is no longer available.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── IN PROGRESS ── */}
        {isInProgress && (
          <Card className="border-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                You have an unfinished attempt.
              </p>
              <Button asChild variant="outline">
                <Link href={`${test.id}/attempt`}>
                  <RotateCcw className="h-4 w-4 mr-2" />Resume Test
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── SUBMITTED ── */}
        {isSubmitted && attempt && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium">
                Submitted {attempt.submitted_at ? formatDateTime(attempt.submitted_at) : ""}
              </p>
            </div>

            {/* Results locked */}
            {!test.results_available && (
              <Card className="border-dashed">
                <CardContent className="pt-6 flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Results not yet released</p>
                    <p className="text-xs mt-0.5">
                      Your institute will release scores and question review soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score summary */}
            {test.results_available && <ScoreSummary attempt={attempt} />}

            {/* Question review */}
            {test.results_available && attempt.answers.length > 0 && (
              <div className="space-y-3">
                <CardTitle className="text-base">Question Review</CardTitle>
                <Accordion type="multiple" className="space-y-2">
                  {attempt.answers.map((a, i) => (
                    <QuestionReviewCard
                      key={a.question_id}
                      answer={a}
                      index={i}
                      resultsAvailable={test.results_available}
                    />
                  ))}
                </Accordion>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}