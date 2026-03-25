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
  return `${m}m`
}

export function formatDateTime(dt?: string): string {
  if (!dt) return "—"
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}


// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DerivedCandidateStatus }) {
  if (status === "live") {
    return (
      <Badge className="gap-1.5 bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-[11px] px-2 py-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        Live
      </Badge>
    )
  }
  if (status === "upcoming") {
    return (
      <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5">
        <CalendarClock className="h-3 w-3" />
        Upcoming
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-[11px] px-2 py-0.5 text-muted-foreground">
      <CheckCircle2 className="h-3 w-3" />
      Ended
    </Badge>
  )
}


// ─── Test Card ────────────────────────────────────────────────────────────────

function TestCard({ test }: { test: CandidateTest }) {
  const isSubmitted  = test.attempt?.status === "submitted"
  const isInProgress = test.attempt?.status === "in_progress"

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base leading-snug">{test.title}</CardTitle>
            <CardDescription
              className={cn(
                "text-xs",
                test.description
                  ? "line-clamp-2"
                  : "italic text-muted-foreground/60"
              )}
            >
              {test.description ?? "No description provided"}
            </CardDescription>
          </div>
          <StatusBadge status={test.derived_status} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4">

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {test.time_limit_seconds
              ? formatDuration(test.time_limit_seconds)
              : "No time limit"}
          </span>
          {test.available_from ? (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDateTime(test.available_from)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 italic text-muted-foreground/60">
              <CalendarClock className="h-3.5 w-3.5" />
              No schedule set
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
        {isInProgress && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            In progress — resume where you left off
          </p>
        )}

        {/* Submitted timestamp */}
        {isSubmitted && (
          <p className="text-xs text-muted-foreground">
            {test.attempt?.submitted_at
              ? <>Submitted {formatDateTime(test.attempt.submitted_at)}</>
              : <span className="italic">Submission time unavailable</span>
            }
          </p>
        )}

        {/* Score (only when results are released) */}
        {isSubmitted && test.results_available && (
          test.attempt?.percentage != null ? (
            <p className="text-sm font-semibold">
              Score:{" "}
              <span className="text-primary">
                {test.attempt.score}/{test.attempt.total_marks}
              </span>{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({test.attempt.percentage.toFixed(1)}%)
              </span>
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground/60">Score not available yet</p>
          )
        )}

        {/* Upcoming note */}
        {test.derived_status === "upcoming" && (
          <p className="text-xs text-muted-foreground">
            {test.available_from
              ? <>Opens {formatDateTime(test.available_from)}</>
              : <span className="italic">Opening time not set</span>
            }
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
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <BookOpen className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">No {label} tests</p>
        <p className="text-xs text-muted-foreground">Check back later for new tests</p>
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

      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">My Tests</h1>
          <p className="text-sm text-muted-foreground">
            {tests.length} test{tests.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

        {/* Tab Bar */}
        <div className="overflow-x-auto px-4 pt-5 md:px-8">
          <TabsList className="inline-flex h-9 gap-0.5 rounded-lg bg-muted p-1">
            {tabConfig.map(({ value, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-md px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                    activeTab === value
                      ? "bg-foreground text-background"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="px-4 py-6 md:px-8">
          {tabConfig.map(({ value, label }) => (
            <TabsContent key={value} value={value} className="mt-0 outline-none">
              {tabTests[value].length === 0 ? (
                <EmptyState label={label.toLowerCase()} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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