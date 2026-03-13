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
import type { CandidateTest, DerivedCandidateStatus } from "./_types"


// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "live" | "upcoming" | "past"

interface TabConfig {
  value: Tab
  label: string
  icon: React.ReactNode
  count: number
}


// ─── Utils ────────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<DerivedCandidateStatus, { badge: React.ReactNode }> = {
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

        {/* In-progress indicator */}
        {test.attempt?.status === "in_progress" && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            In progress — resume where you left off
          </p>
        )}

        {/* Submitted timestamp */}
        {isSubmitted && test.attempt?.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {formatDateTime(test.attempt.submitted_at)}
          </p>
        )}

        {/* Score (only when results are released) */}
        {isSubmitted && test.results_available && test.attempt?.percentage != null && (
          <p className="text-sm font-semibold">
            Score:{" "}
            <span className="text-primary">
              {test.attempt.score}/{test.attempt.total_marks}
            </span>{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({test.attempt.percentage.toFixed(1)}%)
            </span>
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

interface Props {
  tests: CandidateTest[]
}

export function CandidateTestsClient({ tests }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("live")

  const live     = tests.filter((t) => t.derived_status === "live")
  const upcoming = tests.filter((t) => t.derived_status === "upcoming")
  const past     = tests.filter((t) => t.derived_status === "past")

  const tabConfig: TabConfig[] = [
    { value: "live",     label: "Live",     icon: <PlayCircle    className="h-3.5 w-3.5" />, count: live.length     },
    { value: "upcoming", label: "Upcoming", icon: <CalendarClock className="h-3.5 w-3.5" />, count: upcoming.length },
    { value: "past",     label: "Past",     icon: <FileText      className="h-3.5 w-3.5" />, count: past.length     },
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