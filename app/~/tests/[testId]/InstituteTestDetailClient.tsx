"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/InstituteTestDetailClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  FileQuestion,
  CalendarClock,
  BarChart2,
  Tag,
  BookOpen,
  GripVertical,
  Info,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InstituteTestDetail, InstituteQuestion, InstituteAttemptRow } from "./_types"
import { formatDuration, formatDateTime } from "../_types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number | null): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`
}

function pctColor(pct: number | null): string {
  if (pct == null) return "text-muted-foreground"
  if (pct >= 75) return "text-green-600"
  if (pct >= 50) return "text-amber-600"
  return "text-red-500"
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ test }: { test: InstituteTestDetail }) {
  const submitted = test.attempts.filter((a) => a.status === "submitted")
  const avg =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length
        )
      : null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Questions",   value: test.questions.length, icon: <FileQuestion className="h-4 w-4" /> },
        { label: "Attempts",    value: test.attempts.length,  icon: <Users className="h-4 w-4" /> },
        { label: "Submitted",   value: submitted.length,       icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: "Avg. Score",  value: avg != null ? `${avg}%` : "—", icon: <BarChart2 className="h-4 w-4" /> },
      ].map(({ label, value, icon }) => (
        <Card key={label} className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            {icon}{label}
          </div>
          <p className="text-2xl font-bold">{value}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
}: {
  question: InstituteQuestion
  index: number
}) {
  return (
    <AccordionItem
      value={question.id}
      className="border rounded-lg px-1 data-[state=open]:bg-muted/20"
    >
      <AccordionTrigger className="px-3 py-3 hover:no-underline gap-3 [&>svg]:shrink-0">
        <div className="flex items-center gap-3 min-w-0 text-left w-full">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />
          <span className="text-xs text-muted-foreground shrink-0 w-6">Q{index + 1}</span>

          <span className="text-sm font-medium leading-snug line-clamp-2 flex-1 min-w-0">
            {question.question_text}
          </span>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {question.question_type === "single_correct" ? "Single" : "Multiple"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {question.marks} pt{question.marks !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-3 pb-4 space-y-3">
        {/* Options */}
        <div className="space-y-1.5">
          {question.options.map((opt) => (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
                opt.is_correct
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "border-border text-foreground"
              )}
            >
              {opt.is_correct
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
              <span>{opt.option_text}</span>
              {opt.is_correct && (
                <Badge className="ml-auto text-xs bg-green-500 hover:bg-green-500 text-white border-0">
                  Correct
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Tags */}
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {question.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs px-2 py-0.5">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="flex gap-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// ─── Questions Tab ────────────────────────────────────────────────────────────

function QuestionsTab({ questions }: { questions: InstituteQuestion[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
          {questions.reduce((s, q) => s + q.marks, 0)} total marks
        </p>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
          <FileQuestion className="h-10 w-10 opacity-25" />
          <p className="text-sm">No questions yet. Add your first question.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))}
        </Accordion>
      )}
    </div>
  )
}

// ─── Attempts Tab ─────────────────────────────────────────────────────────────

function AttemptsTab({
  attempts,
  resultsAvailable,
  testId,
}: {
  attempts: InstituteAttemptRow[]
  resultsAvailable: boolean
  testId: string
}) {
  const submitted = attempts.filter((a) => a.status === "submitted")
  const inProgress = attempts.filter((a) => a.status === "in_progress")

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Submitted</p>
          <p className="text-2xl font-bold">{submitted.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-2xl font-bold">{inProgress.length}</p>
        </Card>
        {submitted.length > 0 && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Average Score</p>
            <p className="text-2xl font-bold">
              {Math.round(
                submitted.reduce((s, a) => s + (a.percentage ?? 0), 0) / submitted.length
              )}%
            </p>
          </Card>
        )}
      </div>

      {attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
          <Users className="h-10 w-10 opacity-25" />
          <p className="text-sm">No attempts yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Time Spent</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">
                    {a.student_name ?? (
                      <span className="text-muted-foreground italic text-xs">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.status === "submitted" ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-xs">
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">In Progress</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "submitted" && resultsAvailable ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={cn("font-semibold tabular-nums text-sm", pctColor(a.percentage))}>
                          {a.percentage ?? "—"}%
                        </span>
                        {a.score != null && a.total_marks != null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {a.score}/{a.total_marks}
                          </span>
                        )}
                      </div>
                    ) : a.status === "submitted" ? (
                      <span className="text-xs text-muted-foreground">Hidden</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
                    {formatSeconds(a.time_spent_seconds)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {a.submitted_at ? formatDateTime(a.submitted_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  test,
  onToggleResults,
  onTogglePublish,
  isLoading,
}: {
  test: InstituteTestDetail
  onToggleResults: () => void
  onTogglePublish: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Test Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {test.description && (
            <p className="text-muted-foreground">{test.description}</p>
          )}
          {test.instructions && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />Instructions
              </div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {test.instructions}
              </p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Duration: <span className="text-foreground font-medium">{formatDuration(test.time_limit_seconds)}</span></span>
            </div>
            {test.available_from && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>Opens: <span className="text-foreground font-medium">{formatDateTime(test.available_from)}</span></span>
              </div>
            )}
            {test.available_until && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>Closes: <span className="text-foreground font-medium">{formatDateTime(test.available_until)}</span></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Visibility</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {test.status === "published"
                  ? "Visible to students within the availability window."
                  : "Draft — not visible to students."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePublish}
              disabled={isLoading}
              className={cn(
                test.status === "published" ? "text-amber-600 border-amber-300" : "text-green-600 border-green-400"
              )}
            >
              {test.status === "published"
                ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Unpublish</>
                : <><Eye className="h-3.5 w-3.5 mr-1.5" />Publish</>}
            </Button>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Results</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {test.results_available
                  ? "Students can see their scores and question review."
                  : "Scores are hidden from students until you release them."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleResults}
              disabled={isLoading}
              className={cn(
                test.results_available ? "text-amber-600 border-amber-300" : "text-green-600 border-green-400"
              )}
            >
              {test.results_available
                ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Hide Results</>
                : <><Eye className="h-3.5 w-3.5 mr-1.5" />Release Results</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  test: InstituteTestDetail
}

export function InstituteTestDetailClient({ test }: Props) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggleResults() {
    startTransition(async () => {
      // Wire to server action: toggleTestResults(test.id, !test.results_available)
      router.refresh()
    })
  }

  function handleTogglePublish() {
    startTransition(async () => {
      // Wire to server action: toggleTestPublish(test.id, test.status)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

        {/* Back + actions */}
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="../tests">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Tests
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTogglePublish}>
                {test.status === "published"
                  ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Unpublish</>
                  : <><Eye className="h-3.5 w-3.5 mr-2" />Publish</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleResults}>
                {test.results_available
                  ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Hide Results</>
                  : <><Eye className="h-3.5 w-3.5 mr-2" />Release Results</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold leading-tight">{test.title}</h1>
            <Badge
              className={cn(
                "text-xs font-medium border-0",
                test.status === "published"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {test.status === "published" ? "Published" : "Draft"}
            </Badge>
            {test.results_available && (
              <Badge className="text-xs border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <TrendingUp className="h-3 w-3 mr-1" />Results Live
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <StatsBar test={test} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="justify-start border-b border-border w-full rounded-none px-0">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="questions">
              <FileQuestion className="h-4 w-4 mr-2" />Questions
              {test.questions.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {test.questions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attempts">
              <Users className="h-4 w-4 mr-2" />Attempts
              {test.attempts.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {test.attempts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="pt-6">
            <TabsContent value="overview">
              <OverviewTab
                test={test}
                onToggleResults={handleToggleResults}
                onTogglePublish={handleTogglePublish}
                isLoading={isPending}
              />
            </TabsContent>
            <TabsContent value="questions">
              <QuestionsTab questions={test.questions} />
            </TabsContent>
            <TabsContent value="attempts">
              <AttemptsTab
                attempts={test.attempts}
                resultsAvailable={test.results_available}
                testId={test.id}
              />
            </TabsContent>
          </div>
        </Tabs>

      </div>
    </div>
  )
}