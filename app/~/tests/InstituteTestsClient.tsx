"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/InstituteTestsClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutList,
  Plus,
  Eye,
  EyeOff,
  Clock,
  Users,
  FileQuestion,
  CalendarClock,
  FlaskConical,
  CheckCircle2,
  FileText,
  PlayCircle,
  PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"


// ─── Types ────────────────────────────────────────────────────────────────────


type InstituteTestStatus = "draft" | "upcoming" | "live" | "past"
type Tab = "all" | "live" | "upcoming" | "past" | "drafts"


interface InstituteTest {
  id: string
  title: string
  description?: string
  time_limit_seconds: number
  available_from?: string
  available_until?: string
  derived_status: InstituteTestStatus
  status: "draft" | "published"
  results_available: boolean
  question_count: number
  attempt_count: number
}


interface TabConfig {
  value: Tab
  label: string
  icon: React.ReactNode
  count: number
}


// ─── Placeholder Data ─────────────────────────────────────────────────────────


const PLACEHOLDER_TESTS: InstituteTest[] = [
  {
    id: "1",
    title: "JEE Main Mock – Full Syllabus",
    description: "Complete JEE Main pattern test covering Physics, Chemistry, and Mathematics.",
    time_limit_seconds: 10800,
    available_from: "2026-03-10T09:00:00",
    available_until: "2026-03-10T12:00:00",
    derived_status: "live",
    status: "published",
    results_available: false,
    question_count: 90,
    attempt_count: 143,
  },
  {
    id: "2",
    title: "Chemistry – Organic Chapter Test",
    description: "Focused on organic chemistry reactions and mechanisms.",
    time_limit_seconds: 3600,
    available_from: "2026-03-10T14:00:00",
    available_until: "2026-03-10T15:00:00",
    derived_status: "live",
    status: "published",
    results_available: false,
    question_count: 30,
    attempt_count: 67,
  },
  {
    id: "3",
    title: "Physics – Electrostatics",
    time_limit_seconds: 5400,
    available_from: "2026-03-14T10:00:00",
    available_until: "2026-03-14T11:30:00",
    derived_status: "upcoming",
    status: "published",
    results_available: false,
    question_count: 45,
    attempt_count: 0,
  },
  {
    id: "4",
    title: "Mathematics – Calculus Series 2",
    description: "Integration, differentiation, and limits.",
    time_limit_seconds: 7200,
    available_from: "2026-03-18T09:00:00",
    available_until: "2026-03-18T11:00:00",
    derived_status: "upcoming",
    status: "published",
    results_available: false,
    question_count: 50,
    attempt_count: 0,
  },
  {
    id: "5",
    title: "Biology – Cell Biology Quiz",
    time_limit_seconds: 2700,
    available_from: "2026-03-05T09:00:00",
    available_until: "2026-03-05T09:45:00",
    derived_status: "past",
    status: "published",
    results_available: true,
    question_count: 25,
    attempt_count: 89,
  },
  {
    id: "6",
    title: "English Comprehension Test",
    description: "Reading comprehension and vocabulary assessment.",
    time_limit_seconds: 3600,
    available_from: "2026-03-01T11:00:00",
    available_until: "2026-03-01T12:00:00",
    derived_status: "past",
    status: "published",
    results_available: false,
    question_count: 40,
    attempt_count: 112,
  },
  {
    id: "7",
    title: "Aptitude & Reasoning – Draft",
    description: "Work in progress – questions being added.",
    time_limit_seconds: 3600,
    derived_status: "draft",
    status: "draft",
    results_available: false,
    question_count: 12,
    attempt_count: 0,
  },
  {
    id: "8",
    title: "General Knowledge Quiz – Draft",
    time_limit_seconds: 1800,
    derived_status: "draft",
    status: "draft",
    results_available: false,
    question_count: 0,
    attempt_count: 0,
  },
]


// ─── Utils ────────────────────────────────────────────────────────────────────
// TODO: extract to @/lib/format.ts and share with CandidateTestsClient


export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}


export function formatDateTime(dt?: string): string {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}


// ─── Status Config ────────────────────────────────────────────────────────────


const STATUS_CONFIG: Record<InstituteTestStatus, { badge: React.ReactNode }> = {
  live: {
    badge: (
      <Badge className="gap-1.5 bg-green-500 hover:bg-green-500 text-white border-0 shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        Live
      </Badge>
    ),
  },
  upcoming: {
    badge: (
      <Badge variant="secondary" className="gap-1 shrink-0">
        <CalendarClock className="h-3 w-3" />Upcoming
      </Badge>
    ),
  },
  past: {
    badge: (
      <Badge variant="outline" className="gap-1 shrink-0">
        <CheckCircle2 className="h-3 w-3" />Ended
      </Badge>
    ),
  },
  draft: {
    badge: (
      <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground">
        <PenLine className="h-3 w-3" />Draft
      </Badge>
    ),
  },
}


// ─── Test Card ────────────────────────────────────────────────────────────────


function TestCard({ test }: { test: InstituteTest }) {
  const { badge } = STATUS_CONFIG[test.derived_status]

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base leading-snug">{test.title}</CardTitle>
            {test.description && (
              <CardDescription className="line-clamp-2 text-xs">
                {test.description}
              </CardDescription>
            )}
          </div>
          {badge}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4">

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(test.time_limit_seconds)}
          </span>
          <span className="flex items-center gap-1.5">
            <FileQuestion className="h-3.5 w-3.5" />
            {test.question_count} question{test.question_count !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {test.attempt_count} attempt{test.attempt_count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Schedule */}
        {(test.available_from || test.available_until) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {formatDateTime(test.available_from)} → {formatDateTime(test.available_until)}
          </p>
        )}

        {/* Upcoming note */}
        {test.derived_status === "upcoming" && (
          <p className="text-xs text-muted-foreground">
            Opens {formatDateTime(test.available_from)}
          </p>
        )}

        {/* Results visibility indicator */}
        {test.derived_status === "past" && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              test.results_available ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {test.results_available ? (
              <><Eye className="h-3 w-3" />Results visible to students</>
            ) : (
              <><EyeOff className="h-3 w-3" />Results hidden from students</>
            )}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={`tests/${test.id}`}>View Details</Link>
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}


// ─── Empty State ──────────────────────────────────────────────────────────────


function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <FlaskConical className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">
          {isFiltered ? "No tests in this category" : "No tests yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isFiltered
            ? "Try switching tabs to see other tests"
            : "Create your first test to get started"}
        </p>
      </div>
      {!isFiltered && (
        <Button onClick={() => router.push("tests/create")}>
          <Plus className="h-4 w-4 mr-2" />Create Test
        </Button>
      )}
    </div>
  )
}


// ─── Component ────────────────────────────────────────────────────────────────


export function InstituteTestsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const router = useRouter()

  const tests = PLACEHOLDER_TESTS
  const live = tests.filter((t) => t.derived_status === "live")
  const upcoming = tests.filter((t) => t.derived_status === "upcoming")
  const past = tests.filter((t) => t.derived_status === "past")
  const drafts = tests.filter((t) => t.derived_status === "draft")

  const tabConfig: TabConfig[] = [
    { value: "all",      label: "All",      icon: <LayoutList   className="h-3.5 w-3.5" />, count: tests.length   },
    { value: "live",     label: "Live",     icon: <PlayCircle   className="h-3.5 w-3.5" />, count: live.length    },
    { value: "upcoming", label: "Upcoming", icon: <CalendarClock className="h-3.5 w-3.5" />, count: upcoming.length },
    { value: "past",     label: "Past",     icon: <FileText     className="h-3.5 w-3.5" />, count: past.length    },
    { value: "drafts",   label: "Drafts",   icon: <PenLine      className="h-3.5 w-3.5" />, count: drafts.length  },
  ]

  const tabTests: Record<Tab, InstituteTest[]> = { all: tests, live, upcoming, past, drafts }

  return (
    <div className="min-h-screen w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

        {/* Tab Bar */}
        <div className="overflow-x-auto px-4 pt-6 md:px-6 md:pt-8">
          <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl bg-muted p-1">
            {tabConfig.map(({ value, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-background"
              >
                <span>{label}</span>
                {count > 0 && (
                  <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-4 py-6 md:px-6 md:py-8">

          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {tests.length} test{tests.length !== 1 ? "s" : ""} total
            </p>
            <Button onClick={() => router.push("tests/create")}>
              <Plus className="h-4 w-4 mr-2" />Create Test
            </Button>
          </div>

          {/* Tab Contents */}
          {tabConfig.map(({ value }) => (
            <TabsContent key={value} value={value}>
              {tabTests[value].length === 0 ? (
                <EmptyState isFiltered={value !== "all"} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {tabTests[value].map((t) => <TestCard key={t.id} test={t} />)}
                </div>
              )}
            </TabsContent>
          ))}

        </div>
      </Tabs>
    </div>
  )
}
