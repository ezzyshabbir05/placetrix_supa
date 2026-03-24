"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[id]/InstituteTestDetailClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CalendarClock,
  BarChart2,
  Tag,
  BookOpen,
  Info,
  CalendarX,
  Loader2,
  Trash2,
  ListChecks,
  Pencil,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InstituteTestDetail, InstituteQuestion, InstituteAttemptRow } from "./_types"
import { formatDuration, formatDateTime, formatSeconds, resolvePct } from "./_types"


// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ test }: { test: InstituteTestDetail }) {
  const submitted = test.attempts.filter((a) => a.status === "submitted")
  const inProgress = test.attempts.filter((a) => a.status === "in_progress")
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0)

  const avgPct =
    submitted.length > 0
      ? Math.round(
          submitted.reduce(
            (acc, a) => acc + resolvePct(a.percentage, a.score, a.total_marks),
            0
          ) / submitted.length
        )
      : null

  const completionPct =
    test.attempts.length > 0
      ? Math.round((submitted.length / test.attempts.length) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <ListChecks className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Questions</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{test.questions.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalMarks} total pts</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Users className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Attempts</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{test.attempts.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{inProgress.length} in progress</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Submitted</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">{submitted.length}</p>
          <p className="text-xs text-muted-foreground">
            {test.attempts.length > 0 ? `${completionPct}% completion` : "No attempts yet"}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BarChart2 className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Avg Score</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {avgPct != null ? `${avgPct}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {avgPct != null ? "Submitted average" : "No submissions yet"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


// ─── Meta Item ────────────────────────────────────────────────────────────────

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}


// ─── Question Card (Answer Key) ───────────────────────────────────────────────

function QuestionCard({
  question,
  index,
}: {
  question: InstituteQuestion
  index: number
}) {
  const sortedOptions = [...question.options].sort((a, b) => a.order_index - b.order_index)
  const correctCount = sortedOptions.filter((o) => o.is_correct).length

  return (
    <AccordionItem
      value={question.id}
      className="overflow-hidden rounded-xl border bg-card transition-colors data-[state=open]:bg-muted/10"
    >
      <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-px shrink-0 flex h-5 w-6 items-center justify-center rounded-md bg-muted text-[11px] font-bold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-relaxed text-foreground line-clamp-2">
              {question.question_text}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {question.question_type === "single_correct" ? "Single" : "Multi"}
              </Badge>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {question.marks} pt{question.marks !== 1 ? "s" : ""}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {correctCount} correct answer{correctCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-0">
        <Separator className="mb-3" />
        <div className="space-y-1.5">
          {sortedOptions.map((opt) => (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2",
                opt.is_correct
                  ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                  : "border-border bg-muted/20"
              )}
            >
              {opt.is_correct ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "flex-1 text-sm leading-snug",
                  opt.is_correct ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {opt.option_text}
              </span>
              {opt.is_correct && (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
                  Correct
                </span>
              )}
            </div>
          ))}
        </div>

        {question.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground/60" />
            {question.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="h-4 px-1.5 text-[10px] font-normal">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {question.explanation && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border bg-muted/40 p-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}


// ─── Questions Tab (Answer Key) ───────────────────────────────────────────────

function QuestionsTab({ questions }: { questions: InstituteQuestion[] }) {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length > 0 ? (
            <>
              <span className="font-medium text-foreground">{questions.length}</span>{" "}
              question{questions.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-medium text-foreground">{totalMarks}</span> total marks
            </>
          ) : (
            "No questions available"
          )}
        </p>
        <Badge variant="outline" className="gap-1 text-xs">
          <BookOpen className="h-3 w-3" />
          Answer Key
        </Badge>
      </div>

      {questions.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No questions available</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {[...questions]
            .sort((a, b) => a.order_index - b.order_index)
            .map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}
        </Accordion>
      )}
    </div>
  )
}


// ─── Attempt Score ────────────────────────────────────────────────────────────

function AttemptScore({
  attempt,
  scoresVisible,
}: {
  attempt: InstituteAttemptRow
  scoresVisible: boolean
}) {
  if (attempt.status !== "submitted") {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  if (!scoresVisible) {
    return <span className="text-sm italic text-muted-foreground">Hidden</span>
  }

  const pct = resolvePct(attempt.percentage, attempt.score, attempt.total_marks)

  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold tabular-nums">{pct}%</span>
      {attempt.score != null && attempt.total_marks != null && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {attempt.score}/{attempt.total_marks}
        </span>
      )}
    </div>
  )
}


// ─── Attempts Tab ─────────────────────────────────────────────────────────────

function AttemptsTab({ test }: { test: InstituteTestDetail }) {
  const attempts = test.attempts

  // Scores are visible by default for the institute.
  // Toggle locally to hide before screen-sharing with students.
  const [scoresVisible, setScoresVisible] = useState(true)

  const submitted = attempts.filter((a) => a.status === "submitted")
  const inProgress = attempts.filter((a) => a.status === "in_progress")
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0)

  const avgPct =
    submitted.length > 0
      ? Math.round(
          submitted.reduce(
            (acc, a) => acc + resolvePct(a.percentage, a.score, a.total_marks),
            0
          ) / submitted.length
        )
      : null

  const sorted = [
    ...submitted.sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "")),
    ...inProgress.sort((a, b) => b.started_at.localeCompare(a.started_at)),
  ]

  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Email",
      "Status",
      "Score",
      "Total Marks",
      "Percentage (%)",
      "Time Spent",
      "Started At",
      "Submitted At",
    ]

    const rows = sorted.map((a) => [
      a.student_name || "Unknown",
      a.student_email || "—",
      a.status === "submitted" ? "Submitted" : "In Progress",
      a.score ?? "—",
      a.total_marks ?? "—",
      a.status === "submitted" ? resolvePct(a.percentage, a.score, a.total_marks) : "—",
      formatSeconds(a.time_spent_seconds),
      formatDateTime(a.started_at),
      a.submitted_at ? formatDateTime(a.submitted_at) : "—",
    ])

    const escapeCsv = (str: any) => `"${String(str).replace(/"/g, '""')}"`
    const csvContent = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${test.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_results.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = doc.internal.pageSize.width

    let currentY = 14

    if (test.institute_name) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(test.institute_name.toUpperCase(), 14, currentY)
      currentY += 6
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(20, 20, 20)
    doc.text(test.title, 14, currentY)
    currentY += 5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)

    const testInfo = `Test ID: ${test.id}   |   Duration: ${formatDuration(test.time_limit_seconds)}   |   Questions: ${test.questions.length}   |   Total Marks: ${totalMarks}`
    doc.text(testInfo, 14, currentY)
    currentY += 4.5

    const dateStr = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    const attemptInfo = `Total Attempts: ${attempts.length}   |   ${
      avgPct != null ? `Average Score: ${avgPct}%   |   ` : ""
    }Exported On: ${dateStr}`
    doc.text(attemptInfo, 14, currentY)
    currentY += 8

    const tableColumn = ["Student", "Email", "Status", "Score", "Pct", "Time", "Submitted"]
    const tableRows = sorted.map((a) => [
      a.student_name || "Unknown",
      a.student_email || "—",
      a.status === "submitted" ? "Submitted" : "In Progress",
      a.status === "submitted" ? `${a.score ?? "—"}/${a.total_marks ?? "—"}` : "—",
      a.status === "submitted" ? `${resolvePct(a.percentage, a.score, a.total_marks)}%` : "—",
      formatSeconds(a.time_spent_seconds),
      a.submitted_at ? formatDateTime(a.submitted_at) : "—",
    ])

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2,
        textColor: [40, 40, 40],
      },
      headStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fillColor: [249, 250, 251],
        lineWidth: { bottom: 0.5 },
        lineColor: [200, 200, 200],
      },
      bodyStyles: {
        lineWidth: { bottom: 0.1 },
        lineColor: [230, 230, 230],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 70 },
        2: { cellWidth: 22 },
        3: { halign: "right", cellWidth: 16 },
        4: { halign: "right", cellWidth: 12 },
        5: { halign: "right", cellWidth: 26 },
        6: { halign: "right" },
      },
      didDrawPage: (data) => {
        const currentPage = data.pageNumber
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${currentPage}`,
          pageWidth - 14,
          doc.internal.pageSize.height - 8,
          { align: "right" }
        )
      },
    })

    const filename = `${test.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_results.pdf`
    doc.save(filename)
  }

  if (attempts.length === 0) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">No attempts yet</p>
            <p className="text-xs text-muted-foreground">
              Students will appear here once they start the test.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary strip & export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm">
          <span>
            <span className="font-semibold tabular-nums">{submitted.length}</span>
            <span className="ml-1 text-muted-foreground">Submitted</span>
          </span>
          <Separator orientation="vertical" className="h-3.5" />
          <span>
            <span className="font-semibold tabular-nums">{inProgress.length}</span>
            <span className="ml-1 text-muted-foreground">In Progress</span>
          </span>
          {scoresVisible && avgPct != null && (
            <>
              <Separator orientation="vertical" className="h-3.5" />
              <span>
                <span className="font-semibold tabular-nums">{avgPct}%</span>
                <span className="ml-1 text-muted-foreground">Avg Score</span>
              </span>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export as CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Score visibility banner ─────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors",
          scoresVisible
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400"
            : "border-border bg-muted/30 text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {scoresVisible ? (
            <Eye className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>
            {scoresVisible
              ? "Scores visible — hide before screen sharing with students."
              : "Scores hidden locally. Students are unaffected."}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setScoresVisible((v) => !v)}
        >
          {scoresVisible ? "Hide" : "Show Scores"}
        </Button>
      </div>

      {/* Mobile compact list */}
      <div className="rounded-xl border overflow-hidden divide-y md:hidden">
        {sorted.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {a.student_name ?? "Unknown"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                {a.student_email ?? formatDateTime(a.started_at)}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-right">
                <AttemptScore attempt={a} scoresVisible={scoresVisible} />
                <p className="text-[10px] tabular-nums text-muted-foreground leading-tight">
                  {formatSeconds(a.time_spent_seconds)}
                </p>
              </div>
              <Badge
                variant={a.status === "submitted" ? "default" : "secondary"}
                className="text-[10px] px-1.5 shrink-0"
              >
                {a.status === "submitted" ? "Submitted" : "In Progress"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Score</TableHead>
              <TableHead className="text-right text-xs font-semibold">Time</TableHead>
              <TableHead className="text-xs font-semibold">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="truncate text-sm font-medium">{a.student_name ?? "Unknown"}</p>
                  {a.student_email && (
                    <p className="truncate text-xs text-muted-foreground">{a.student_email}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={a.status === "submitted" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {a.status === "submitted" ? "Submitted" : "In Progress"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <AttemptScore attempt={a} scoresVisible={scoresVisible} />
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatSeconds(a.time_spent_seconds)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.submitted_at ? formatDateTime(a.submitted_at) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Test Details</CardTitle>
          <CardDescription className="text-xs">Setup, content, and availability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {test.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{test.description}</p>
          )}
          {test.instructions && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Instructions
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {test.instructions}
              </p>
            </div>
          )}
          <Separator />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetaItem
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Duration"
              value={formatDuration(test.time_limit_seconds)}
            />
            <MetaItem
              icon={<ListChecks className="h-3.5 w-3.5" />}
              label="Questions"
              value={`${test.questions.length} questions · ${test.questions.reduce((s, q) => s + q.marks, 0)} pts`}
            />
            {test.available_from && (
              <MetaItem
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Opens"
                value={formatDateTime(test.available_from)}
              />
            )}
            {test.available_until && (
              <MetaItem
                icon={<CalendarX className="h-3.5 w-3.5" />}
                label="Closes"
                value={formatDateTime(test.available_until)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Controls</CardTitle>
          <CardDescription className="text-xs">Manage visibility and result release.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: "Visibility",
              description:
                test.status === "published"
                  ? "Visible to students within the availability window."
                  : "Draft mode — students cannot see this test.",
              active: test.status === "published",
              onAction: onTogglePublish,
              activeLabel: "Unpublish",
              inactiveLabel: "Publish",
            },
            {
              title: "Results",
              description: test.results_available
                ? "Students can see scores and question review."
                : "Scores remain hidden until you release results.",
              active: test.results_available,
              onAction: onToggleResults,
              activeLabel: "Hide Results",
              inactiveLabel: "Release Results",
            },
          ].map(({ title, description, active, onAction, activeLabel, inactiveLabel }, i) => (
            <div key={title}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAction}
                  disabled={isLoading}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {isLoading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : active ? (
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {active ? activeLabel : inactiveLabel}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  test: InstituteTestDetail
  onToggleResults?: () => Promise<void>
  onTogglePublish?: () => Promise<void>
  onDeleteTest?: () => Promise<void>
}

export function InstituteTestDetailClient({
  test,
  onToggleResults,
  onTogglePublish,
  onDeleteTest,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isPending, startTransition] = useTransition()

  const run = (fn?: () => Promise<void>) => {
    if (!fn) return
    startTransition(async () => {
      await fn()
    })
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto space-y-6 px-4 py-8 md:px-8">
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 min-w-0">
            {test.institute_name && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {test.institute_name}
              </p>
            )}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {test.title}
              </h1>
              <Badge variant={test.status === "published" ? "default" : "secondary"} className="text-xs">
                {test.status === "published" ? "Published" : "Draft"}
              </Badge>
              {test.results_available && (
                <Badge variant="outline" className="text-xs">
                  Results Live
                </Badge>
              )}
            </div>
            {test.description && (
              <p className="max-w-2xl text-sm text-muted-foreground line-clamp-2">
                {test.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/~/tests/${test.id}/edit`)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit Test
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => run(onTogglePublish)} disabled={isPending}>
                {test.status === "published" ? (
                  <>
                    <EyeOff className="mr-2 h-3.5 w-3.5" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(onToggleResults)} disabled={isPending}>
                {test.results_available ? (
                  <>
                    <EyeOff className="mr-2 h-3.5 w-3.5" />
                    Hide Results
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Release Results
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete Test
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{test.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the test, all questions, and all student attempts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant={"destructive"}
                      onClick={() => run(onDeleteTest)}
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <StatsBar test={test} />

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-9 gap-0.5 rounded-lg bg-muted p-1">
              {[
                { value: "overview", label: "Overview", icon: <Info className="h-3.5 w-3.5" />, count: null },
                { value: "questions", label: "Questions", icon: <ListChecks className="h-3.5 w-3.5" />, count: test.questions.length },
                { value: "attempts", label: "Attempts", icon: <Users className="h-3.5 w-3.5" />, count: test.attempts.length },
              ].map(({ value, label, icon, count }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="gap-1.5 rounded-md px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {icon}
                  <span>{label}</span>
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                        activeTab === value
                          ? "bg-foreground text-background"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0">
            <OverviewTab
              test={test}
              onToggleResults={() => run(onToggleResults)}
              onTogglePublish={() => run(onTogglePublish)}
              isLoading={isPending}
            />
          </TabsContent>

          <TabsContent value="questions" className="m-0">
            <QuestionsTab questions={test.questions} />
          </TabsContent>

          <TabsContent value="attempts" className="m-0">
            <AttemptsTab test={test} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
