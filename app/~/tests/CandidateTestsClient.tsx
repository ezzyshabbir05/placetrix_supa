"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/CandidateTestsClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"



// ─── Types ────────────────────────────────────────────────────────────────────



type DerivedStatus = "live" | "upcoming" | "past"
type Tab = "live" | "upcoming" | "past"


interface CandidateTestAttempt {
  status: "in_progress" | "submitted"
  submitted_at?: string
  score?: number
  total_marks?: number
  percentage?: number
}


interface CandidateTest {
  id: string
  title: string
  description?: string
  time_limit_seconds: number
  available_from?: string
  derived_status: DerivedStatus
  results_available: boolean
  attempt?: CandidateTestAttempt
}


interface TabConfig {
  value: Tab
  label: string
  icon: React.ReactNode
  count: number
}



// ─── Placeholder Data ─────────────────────────────────────────────────────────



const PLACEHOLDER_TESTS: CandidateTest[] = [
  {
    id: "1",
    title: "Mathematics Mock Test – Series 1",
    description: "Covers algebra, trigonometry, and calculus fundamentals.",
    time_limit_seconds: 5400,
    available_from: "2026-03-10T09:00:00",
    derived_status: "live",
    results_available: false,
    attempt: { status: "in_progress" },
  },
  {
    id: "2",
    title: "Physics Chapter Test",
    description: "Laws of motion, work, energy, and power.",
    time_limit_seconds: 3600,
    available_from: "2026-03-10T08:00:00",
    derived_status: "live",
    results_available: false,
  },
  {
    id: "3",
    title: "Chemistry Full Syllabus",
    description: "Organic and inorganic chemistry combined test.",
    time_limit_seconds: 7200,
    available_from: "2026-03-12T10:00:00",
    derived_status: "upcoming",
    results_available: false,
  },
  {
    id: "4",
    title: "Biology Unit Test",
    time_limit_seconds: 2700,
    available_from: "2026-03-15T14:00:00",
    derived_status: "upcoming",
    results_available: false,
  },
  {
    id: "5",
    title: "English Grammar & Comprehension",
    description: "Vocabulary, comprehension, and grammar.",
    time_limit_seconds: 3600,
    available_from: "2026-03-05T09:00:00",
    derived_status: "past",
    results_available: true,
    attempt: {
      status: "submitted",
      submitted_at: "2026-03-05T10:45:00",
      score: 78,
      total_marks: 100,
      percentage: 78,
    },
  },
  {
    id: "6",
    title: "History & Civics",
    description: "Modern Indian history and constitutional framework.",
    time_limit_seconds: 3600,
    available_from: "2026-03-01T09:00:00",
    derived_status: "past",
    results_available: true,
    attempt: {
      status: "submitted",
      submitted_at: "2026-03-01T10:30:00",
      score: 42,
      total_marks: 80,
      percentage: 53,
    },
  },
  {
    id: "7",
    title: "General Science Quiz",
    time_limit_seconds: 1800,
    available_from: "2026-02-28T11:00:00",
    derived_status: "past",
    results_available: false,
    attempt: {
      status: "submitted",
      submitted_at: "2026-02-28T11:29:00",
    },
  },
  {
    id: "8",
    title: "Aptitude & Reasoning Test",
    time_limit_seconds: 2700,
    available_from: "2026-02-20T09:00:00",
    derived_status: "past",
    results_available: false,
  },
]



// ─── Utils ────────────────────────────────────────────────────────────────────
// TODO: extract to @/lib/format.ts and share with InstituteTestsClient



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



const STATUS_CONFIG: Record<DerivedStatus, { badge: React.ReactNode; }> = {
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
}



// ─── Test Card ────────────────────────────────────────────────────────────────



function TestCard({ test }: { test: CandidateTest }) {
  const { badge } = STATUS_CONFIG[test.derived_status]
  const isSubmitted = test.attempt?.status === "submitted"

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
          {test.available_from && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDateTime(test.available_from)}
            </span>
          )}
        </div>

        {/* Past – not attempted */}
        {test.derived_status === "past" && !test.attempt && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Not attempted
          </p>
        )}

        {/* Submitted timestamp */}
        {isSubmitted && test.attempt?.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {formatDateTime(test.attempt.submitted_at)}
          </p>
        )}

        {/* Upcoming note */}
        {test.derived_status === "upcoming" && (
          <p className="text-xs text-muted-foreground">
            Opens {formatDateTime(test.available_from)}
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



function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <BookOpen className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">No {label} tests</p>
        <p className="text-sm text-muted-foreground">Check back later for new tests</p>
      </div>
    </div>
  )
}



// ─── Component ────────────────────────────────────────────────────────────────


// ─── Component ────────────────────────────────────────────────────────────────

export function CandidateTestsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("live")

  const tests = PLACEHOLDER_TESTS
  const live = tests.filter((t) => t.derived_status === "live")
  const upcoming = tests.filter((t) => t.derived_status === "upcoming")
  const past = tests.filter((t) => t.derived_status === "past")

  const tabConfig: TabConfig[] = [
    { value: "live", label: "Live", icon: <PlayCircle className="h-3.5 w-3.5" />, count: live.length },
    { value: "upcoming", label: "Upcoming", icon: <CalendarClock className="h-3.5 w-3.5" />, count: upcoming.length },
    { value: "past", label: "Past", icon: <FileText className="h-3.5 w-3.5" />, count: past.length },
  ]

  const tabTests: Record<Tab, CandidateTest[]> = { live, upcoming, past }

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
                {count != null && count > 0 && (
                  <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-4 py-6 md:px-6 md:py-8">
          {tabConfig.map(({ value, label }) => (
            <TabsContent key={value} value={value}>
              {tabTests[value].length === 0 ? (
                <EmptyState label={label.toLowerCase()} />
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

