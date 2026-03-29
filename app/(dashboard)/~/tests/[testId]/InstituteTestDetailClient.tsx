"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[id]/InstituteTestDetailClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InstituteTestDetail, InstituteQuestion, InstituteAttemptRow } from "./_types"
import { formatDuration, formatDateTime, formatSeconds, resolvePct } from "./_types"


// ─── Action State Hook ────────────────────────────────────────────────────────

type ActionKey = "toggleResults" | "togglePublish" | "deleteTest" | null

function useActionState() {
  const [activeAction, setActiveAction] = useState<ActionKey>(null)

  const run = useCallback(
    async (key: ActionKey, fn?: () => Promise<void>) => {
      if (!fn || activeAction !== null) return
      setActiveAction(key)
      try {
        await fn()
      } finally {
        setActiveAction(null)
      }
    },
    [activeAction]
  )

  const isLoading = (key: ActionKey) => activeAction === key
  const anyLoading = activeAction !== null

  return { run, isLoading, anyLoading }
}


// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ test, liveAttempts }: { test: InstituteTestDetail; liveAttempts: InstituteAttemptRow[] }) {
  const submitted = liveAttempts.filter((a) => a.status === "submitted")
  const inProgress = liveAttempts.filter((a) => a.status === "in_progress")
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0)

  const avgPct =
    submitted.length > 0
      ? (
        submitted.reduce(
          (acc, a) => acc + resolvePct(a.percentage, a.score, a.total_marks),
          0
        ) / submitted.length
      ).toFixed(2)
      : null

  const completionPct =
    liveAttempts.length > 0
      ? ((submitted.length / liveAttempts.length) * 100).toFixed(2)
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
          <p className="text-2xl font-bold tabular-nums">{liveAttempts.length}</p>
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

function AttemptsTab({ test, liveAttempts }: { test: InstituteTestDetail; liveAttempts: InstituteAttemptRow[] }) {
  const attempts = liveAttempts
  const [scoresVisible, setScoresVisible] = useState(false)

  const submitted = attempts.filter((a) => a.status === "submitted")
  const inProgress = attempts.filter((a) => a.status === "in_progress")
  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0)

  const avgPct =
    submitted.length > 0
      ? (
        submitted.reduce(
          (acc, a) => acc + resolvePct(a.percentage, a.score, a.total_marks),
          0
        ) / submitted.length
      ).toFixed(2)
      : null

  type SortColumn = "student_name" | "education" | "status" | "score" | "time" | "violations" | "submitted"
  type SortDirection = "asc" | "desc"
  const [sortCol, setSortCol] = useState<SortColumn>("submitted")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("desc") }
  }

  const sorted = [...attempts].sort((a, b) => {
    let diff = 0
    switch (sortCol) {
      case "student_name":
        diff = (a.student_name || "").localeCompare(b.student_name || "")
        break
      case "education":
        diff = (a.branch || "").localeCompare(b.branch || "")
        if (diff === 0) diff = (a.passout_year || 0) - (b.passout_year || 0)
        break
      case "status":
        diff = a.status.localeCompare(b.status)
        break
      case "score": {
        const scoreA = a.status === "submitted" ? resolvePct(a.percentage, a.score, a.total_marks) : -1
        const scoreB = b.status === "submitted" ? resolvePct(b.percentage, b.score, b.total_marks) : -1
        diff = scoreA - scoreB
        break
      }
      case "time":
        diff = (a.time_spent_seconds || 0) - (b.time_spent_seconds || 0)
        break
      case "violations":
        diff = (a.tab_switch_count || 0) - (b.tab_switch_count || 0)
        break
      case "submitted":
        diff = (a.submitted_at ?? a.started_at).localeCompare(b.submitted_at ?? b.started_at)
        break
    }
    return sortDir === "asc" ? diff : -diff
  })

  const SortableHead = ({ label, col, align = "left" }: { label: ReactNode; col: SortColumn; align?: "left" | "center" | "right" }) => {
    return (
      <TableHead
        className={cn(
          "text-xs font-semibold select-none cursor-pointer hover:bg-muted/60 transition-colors",
          align === "right" && "text-right",
          align === "center" && "text-center"
        )}
        onClick={() => handleSort(col)}
      >
        <div className={cn("flex items-center gap-1.5", align === "right" && "justify-end", align === "center" && "justify-center")}>
          {label}
          {sortCol === col ? (
            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-20" />
          )}
        </div>
      </TableHead>
    )
  }

  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Email",
      "Branch",
      "Passout Year",
      "Status",
      "Score",
      "Total Marks",
      "Percentage (%)",
      "Time Spent",
      "Violations",
      "Started At",
      "Submitted At",
    ]

    const rows = sorted.map((a) => [
      a.student_name || "Unknown",
      a.student_email || "—",
      a.branch || "—",
      a.passout_year?.toString() || "—",
      a.status === "submitted" ? "Submitted" : "In Progress",
      a.score ?? "—",
      a.total_marks ?? "—",
      a.status === "submitted" ? resolvePct(a.percentage, a.score, a.total_marks) : "—",
      formatSeconds(a.time_spent_seconds),
      a.tab_switch_count?.toString() ?? "0",
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

    const attemptInfo = `Total Attempts: ${attempts.length}   |   ${avgPct != null ? `Average Score: ${avgPct}%   |   ` : ""
      }Exported On: ${dateStr}`
    doc.text(attemptInfo, 14, currentY)
    currentY += 8

    const tableColumn = ["Student", "Email", "Branch", "Grad", "Status", "Score", "Pct", "Time", "Viol", "Submitted"]
    const tableRows = sorted.map((a) => [
      a.student_name || "Unknown",
      a.student_email || "—",
      a.branch || "—",
      a.passout_year?.toString() || "—",
      a.status === "submitted" ? "Submitted" : "In Progress",
      a.status === "submitted" ? `${a.score ?? "—"}/${a.total_marks ?? "—"}` : "—",
      a.status === "submitted" ? `${resolvePct(a.percentage, a.score, a.total_marks)}%` : "—",
      formatSeconds(a.time_spent_seconds),
      a.tab_switch_count?.toString() ?? "0",
      a.submitted_at ? formatDateTime(a.submitted_at) : "—",
    ])

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 3,
        textColor: [60, 60, 60],
      },
      headStyles: {
        fontSize: 7.5,
        textColor: [20, 20, 20],
        fontStyle: "bold",
        fillColor: [252, 252, 252],
        lineWidth: { bottom: 0.2 },
        lineColor: [200, 200, 200],
      },
      bodyStyles: {
        lineWidth: { bottom: 0.1 },
        lineColor: [240, 240, 240],
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Student
        1: { cellWidth: 50 }, // Email
        2: { cellWidth: 40 }, // Branch
        3: { halign: "center", cellWidth: 15 }, // Grad
        4: { cellWidth: 18 }, // Status
        5: { halign: "right", cellWidth: 15 }, // Score
        6: { halign: "right", cellWidth: 12 }, // Pct
        7: { halign: "right", cellWidth: 20 }, // Time
        8: { halign: "center", cellWidth: 12 }, // Viol
        9: { halign: "right" }, // Submitted
      },
      didDrawPage: (data) => {
        const currentPage = data.pageNumber
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(180, 180, 180)
        doc.text("Generated with Placetrix", 14, pageHeight - 8)
        doc.setFontSize(7)
        doc.text(
          `Page ${currentPage}`,
          pageWidth - 14,
          pageHeight - 8,
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

      {/* Score visibility banner */}
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
          <span>{scoresVisible ? "Scores visible" : "Scores hidden"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setScoresVisible((v) => !v)}
          >
            {scoresVisible ? "Hide" : "Show Scores"}
          </Button>

          <Separator orientation="vertical" className="h-4 md:hidden" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs md:hidden flex items-center gap-1.5">
                Sort <ArrowUpDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleSort("student_name")}>Name {sortCol === "student_name" && (sortDir === "asc" ? "↑" : "↓")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("score")}>Score {sortCol === "score" && (sortDir === "asc" ? "↑" : "↓")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("time")}>Time spent {sortCol === "time" && (sortDir === "asc" ? "↑" : "↓")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("submitted")}>Date submitted {sortCol === "submitted" && (sortDir === "asc" ? "↑" : "↓")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile compact list */}
      <div className="rounded-xl border overflow-hidden divide-y md:hidden">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {a.student_name ?? "Unknown"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                {a.student_email ?? formatDateTime(a.started_at)}
                {(a.branch || a.passout_year) && (
                  <>
                    <span className="mx-1.5 opacity-50">•</span>
                    {a.branch || "—"} {a.passout_year ? `('${a.passout_year.toString().slice(-2)})` : ""}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-right">
                <AttemptScore attempt={a} scoresVisible={scoresVisible} />
                <p className="text-[10px] tabular-nums text-muted-foreground leading-tight">
                  {formatSeconds(a.time_spent_seconds)}
                </p>
                {a.tab_switch_count != null && a.tab_switch_count > 0 && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 block leading-tight">
                    {a.tab_switch_count} viol.
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs shrink-0 text-right w-[68px]",
                  a.status === "submitted" ? "text-foreground font-medium" : "text-muted-foreground text-[11px]"
                )}
              >
                {a.status === "submitted" ? "Submitted" : "In Progress"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <SortableHead label="Student" col="student_name" />
              <SortableHead label="Education" col="education" />
              <SortableHead label="Status" col="status" />
              <SortableHead label="Score" col="score" align="right" />
              <SortableHead label="Time" col="time" align="right" />
              <SortableHead label="Violations" col="violations" align="center" />
              <SortableHead label="Submitted" col="submitted" />
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
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{a.branch || "—"}</span>
                    <span className="text-xs text-muted-foreground">{a.passout_year || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap",
                      a.status === "submitted" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {a.status === "submitted" ? "Submitted" : "In Progress"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <AttemptScore attempt={a} scoresVisible={scoresVisible} />
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatSeconds(a.time_spent_seconds)}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                  {a.tab_switch_count != null && a.tab_switch_count > 0 ? (
                    a.tab_switch_count
                  ) : (
                    "—"
                  )}
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
  isToggleResultsLoading,
  isTogglePublishLoading,
  anyLoading,
}: {
  test: InstituteTestDetail
  onToggleResults: () => void
  onTogglePublish: () => void
  isToggleResultsLoading: boolean
  isTogglePublishLoading: boolean
  anyLoading: boolean
}) {
  const controls = [
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
      isLoading: isTogglePublishLoading,
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
      isLoading: isToggleResultsLoading,
    },
  ]

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
          {controls.map(
            ({ title, description, active, onAction, activeLabel, inactiveLabel, isLoading }, i) => (
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
                    disabled={anyLoading}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : active ? (
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {isLoading ? "Saving…" : active ? activeLabel : inactiveLabel}
                  </Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  testId: string
  test: InstituteTestDetail
  onToggleResults?: () => Promise<void>
  onTogglePublish?: () => Promise<void>
  onDeleteTest?: () => Promise<void>
}

export function InstituteTestDetailClient({
  testId,
  test,
  onToggleResults,
  onTogglePublish,
  onDeleteTest,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const { run, isLoading, anyLoading } = useActionState()

  // ── Live attempts state ──────────────────────────────────────────────────
  const [liveAttempts, setLiveAttempts] = useState<InstituteAttemptRow[]>(test.attempts)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  // Re-fetch the full attempts list from the client side
  const refreshAttempts = useCallback(async () => {
    const supabase = createClient()

    // 1. Parallelize initial attempt details and metadata
    const [detailsRes, infoRes] = await Promise.all([
      supabase
        .from("attempt_details")
        .select(`id, student_name, student_email, status, score, total_marks, percentage, time_spent_seconds, started_at, submitted_at`)
        .eq("test_id", testId)
        .order("started_at", { ascending: false }),
      supabase
        .from("test_attempts")
        .select("id, student_id, tab_switch_count")
        .eq("test_id", testId)
    ])

    const rawAttempts = detailsRes.data
    const attemptsInfo = infoRes.data

    // 2. Extract student IDs and fetch profiles in parallel
    const studentIds = Array.from(
      new Set((attemptsInfo ?? []).map((r) => r.student_id).filter(Boolean))
    ) as string[]

    const { data: candidateProfiles } = await supabase
      .from("candidate_profiles")
      .select("profile_id, course_name, passout_year")
      .in("profile_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])

    const profileMap = new Map((candidateProfiles ?? []).map((p) => [p.profile_id, p]))
    const extraInfoMap = new Map(
      (attemptsInfo ?? []).map((r) => [
        r.id,
        {
          tab_switch_count: r.tab_switch_count,
          branch: r.student_id ? profileMap.get(r.student_id)?.course_name ?? null : null,
          passout_year: r.student_id ? profileMap.get(r.student_id)?.passout_year ?? null : null,
        },
      ])
    )

    const fullTotalMarks = test.questions.reduce((s, q) => s + q.marks, 0)

    const freshAttempts: InstituteAttemptRow[] = (rawAttempts ?? [])
      .filter(
        (a): a is typeof a & { id: string; started_at: string } =>
          a.id != null && a.started_at != null
      )
      .map((a) => {
        const extra = extraInfoMap.get(a.id)
        return {
          id: a.id,
          student_name: a.student_name ?? null,
          student_email: a.student_email ?? null,
          status: a.status as InstituteAttemptRow["status"],
          score: a.score ?? null,
          total_marks: fullTotalMarks > 0 ? fullTotalMarks : (a.total_marks ?? null),
          percentage:
            a.score != null && fullTotalMarks > 0
              ? ((a.score / fullTotalMarks) * 100)
              : (a.percentage ?? null),
          time_spent_seconds: a.time_spent_seconds ?? null,
          started_at: a.started_at,
          submitted_at: a.submitted_at ?? null,
          tab_switch_count: extra?.tab_switch_count ?? null,
          branch: extra?.branch ?? null,
          passout_year: extra?.passout_year ?? null,
        }
      })

    setLiveAttempts(freshAttempts)
  }, [testId, test.questions])

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`test-attempts:${testId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_attempts",
          filter: `test_id=eq.${testId}`,
        },
        () => {
          // Debounce the refresh to once every 2 seconds to handle high load
          if (refreshTimerRef.current) return
          refreshTimerRef.current = setTimeout(() => {
            refreshAttempts()
            refreshTimerRef.current = null
          }, 2000)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [testId, refreshAttempts])

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto space-y-6 px-4 py-8 md:px-8">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
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
              <Badge
                variant={test.status === "published" ? "default" : "secondary"}
                className="text-xs"
              >
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
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 sm:w-auto"
                disabled={anyLoading}
              >
                {anyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push(`/~/tests/${test.id}/edit`)}
                disabled={anyLoading}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit Test
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Publish toggle */}
              <DropdownMenuItem
                onClick={() => run("togglePublish", onTogglePublish)}
                disabled={anyLoading}
              >
                {isLoading("togglePublish") ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : test.status === "published" ? (
                  <EyeOff className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Eye className="mr-2 h-3.5 w-3.5" />
                )}
                {isLoading("togglePublish")
                  ? "Saving…"
                  : test.status === "published"
                    ? "Unpublish"
                    : "Publish"}
              </DropdownMenuItem>

              {/* Results toggle */}
              <DropdownMenuItem
                onClick={() => run("toggleResults", onToggleResults)}
                disabled={anyLoading}
              >
                {isLoading("toggleResults") ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : test.results_available ? (
                  <EyeOff className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Eye className="mr-2 h-3.5 w-3.5" />
                )}
                {isLoading("toggleResults")
                  ? "Saving…"
                  : test.results_available
                    ? "Hide Results"
                    : "Release Results"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                    disabled={anyLoading}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete Test
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{test.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the test, all questions, and all student
                      attempts. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading("deleteTest")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isLoading("deleteTest")}
                      onClick={(e) => {
                        e.preventDefault()
                        run("deleteTest", onDeleteTest)
                      }}
                    >
                      {isLoading("deleteTest") ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Deleting…
                        </>
                      ) : (
                        "Delete permanently"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <StatsBar test={test} liveAttempts={liveAttempts} />

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-9 gap-0.5 rounded-lg bg-muted p-1">
              {[
                { value: "overview", label: "Overview", icon: <Info className="h-3.5 w-3.5" />, count: null },
                { value: "questions", label: "Questions", icon: <ListChecks className="h-3.5 w-3.5" />, count: test.questions.length },
                { value: "attempts", label: "Attempts", icon: <Users className="h-3.5 w-3.5" />, count: liveAttempts.length },
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
              onToggleResults={() => run("toggleResults", onToggleResults)}
              onTogglePublish={() => run("togglePublish", onTogglePublish)}
              isToggleResultsLoading={isLoading("toggleResults")}
              isTogglePublishLoading={isLoading("togglePublish")}
              anyLoading={anyLoading}
            />
          </TabsContent>

          <TabsContent value="questions" className="m-0">
            <QuestionsTab questions={test.questions} />
          </TabsContent>

          <TabsContent value="attempts" className="m-0">
            <AttemptsTab test={test} liveAttempts={liveAttempts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
