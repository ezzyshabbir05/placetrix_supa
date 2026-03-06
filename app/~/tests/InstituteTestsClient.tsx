"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutList, Plus, Eye, EyeOff, Pencil, Trash2,
  Clock, Users, FileQuestion, CalendarClock,
  MoreHorizontal, BookOpen, FlaskConical,
} from "lucide-react"



// ─── Placeholder data ─────────────────────────────────────────────────────────



const PLACEHOLDER_TESTS = [
  {
    id: "1",
    title: "Mid-Semester Assessment – Computer Science",
    description: "Covers data structures, algorithms, and OS fundamentals.",
    duration_minutes: 90,
    scheduled_start: "2026-03-10T10:00:00",
    scheduled_end: "2026-03-10T11:30:00",
    is_published: true,
    status: "live" as const,
    question_count: 40,
    submission_count: 18,
  },
  {
    id: "2",
    title: "DBMS Unit Test – SQL & Normalisation",
    description: "Focuses on SQL queries, joins, and normalisation up to 3NF.",
    duration_minutes: 60,
    scheduled_start: "2026-03-15T09:00:00",
    scheduled_end: "2026-03-15T10:00:00",
    is_published: true,
    status: "upcoming" as const,
    question_count: 25,
    submission_count: 0,
  },
  {
    id: "3",
    title: "Web Technologies – HTML/CSS/JS",
    description: "Practical assessment on frontend fundamentals.",
    duration_minutes: 45,
    scheduled_start: "2026-02-20T11:00:00",
    scheduled_end: "2026-02-20T11:45:00",
    is_published: true,
    status: "past" as const,
    question_count: 30,
    submission_count: 62,
  },
  {
    id: "4",
    title: "Python Programming – Draft",
    description: "Under construction. Covers loops, functions, and OOP.",
    duration_minutes: 60,
    scheduled_start: null,
    scheduled_end: null,
    is_published: false,
    status: "draft" as const,
    question_count: 0,
    submission_count: 0,
  },
]

const STATUS_CONFIG = {
  draft:    { label: "Draft",    className: "bg-muted text-muted-foreground border-0" },
  upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0" },
  live:     { label: "Live",     className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0" },
  past:     { label: "Ended",    className: "bg-secondary text-secondary-foreground border-0" },
}



// ─── Helpers ──────────────────────────────────────────────────────────────────



function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}



// ─── Test Card ────────────────────────────────────────────────────────────────



function TestCard({ test }: { test: typeof PLACEHOLDER_TESTS[0] }) {
  const { label, className } = STATUS_CONFIG[test.status]

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base leading-snug">{test.title}</CardTitle>
            {test.description && (
              <CardDescription className="line-clamp-2 text-xs">{test.description}</CardDescription>
            )}
          </div>
          <Badge className={`shrink-0 text-xs font-medium ${className}`}>{label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4">

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(test.duration_minutes)}
          </span>
          <span className="flex items-center gap-1.5">
            <FileQuestion className="h-3.5 w-3.5" />
            {test.question_count} question{test.question_count !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {test.submission_count} attempt{test.submission_count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Schedule */}
        {(test.scheduled_start || test.scheduled_end) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {formatDateTime(test.scheduled_start)} → {formatDateTime(test.scheduled_end)}
          </div>
        )}

        <div className="mt-auto pt-2">
          <Separator className="mb-3" />
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className={test.is_published ? "text-amber-600" : "text-green-600"}
            >
              {test.is_published
                ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Unpublish</>
                : <><Eye className="h-3.5 w-3.5 mr-1.5" />Publish</>}
            </Button>
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}



// ─── Empty State ──────────────────────────────────────────────────────────────



function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <FlaskConical className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">No tests yet</p>
        <p className="text-sm text-muted-foreground">Create your first test to get started</p>
      </div>
      <Button disabled>
        <Plus className="h-4 w-4 mr-2" />Create Test
      </Button>
    </div>
  )
}



// ─── Component ────────────────────────────────────────────────────────────────



export function InstituteTestsClient() {
  const [activeTab, setActiveTab] = useState("all")

  const live     = PLACEHOLDER_TESTS.filter((t) => t.status === "live")
  const upcoming = PLACEHOLDER_TESTS.filter((t) => t.status === "upcoming")
  const past     = PLACEHOLDER_TESTS.filter((t) => t.status === "past")
  const drafts   = PLACEHOLDER_TESTS.filter((t) => t.status === "draft")

  const tabConfig = [
    { value: "all",      label: "All",      count: PLACEHOLDER_TESTS.length },
    { value: "live",     label: "Live",     count: live.length },
    { value: "upcoming", label: "Upcoming", count: upcoming.length },
    { value: "past",     label: "Past",     count: past.length },
    { value: "drafts",   label: "Drafts",   count: drafts.length },
  ]

  const tabTests: Record<string, typeof PLACEHOLDER_TESTS> = {
    all:      PLACEHOLDER_TESTS,
    live,
    upcoming,
    past,
    drafts,
  }

  return (
    <div className="min-h-screen w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        {/* ── Tab Bar ── */}
        <div className="w-full overflow-x-auto no-scrollbar pb-px border-b border-border">
          <TabsList variant="line" className="px-4 md:px-6 justify-start">
            {tabConfig.map(({ value, label, count }) => (
              <TabsTrigger key={value} value={value}>
                {value === "all" && <LayoutList className="h-4 w-4 mr-2" />}
                {value === "live" && <BookOpen className="h-4 w-4 mr-2" />}
                {label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-4 py-6 md:px-6 md:py-8">

          {/* ── Create button ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                {PLACEHOLDER_TESTS.length} test{PLACEHOLDER_TESTS.length !== 1 ? "s" : ""} total
              </h2>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />Create Test
            </Button>
          </div>

          {/* ── Tab contents ── */}
          {tabConfig.map(({ value }) => (
            <TabsContent key={value} value={value}>
              {tabTests[value].length === 0
                ? <EmptyState />
                : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tabTests[value].map((t) => (
                      <TestCard key={t.id} test={t} />
                    ))}
                  </div>
                )}
            </TabsContent>
          ))}

        </div>
      </Tabs>
    </div>
  )
}