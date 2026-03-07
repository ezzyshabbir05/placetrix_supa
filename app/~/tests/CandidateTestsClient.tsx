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
import { Progress } from "@/components/ui/progress"
import {
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  Clock,
  FileText,
  Trophy,
  AlertCircle,
  BookOpen,
  RotateCcw,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CandidateTest,
  type DerivedStatus,
  formatDuration,
  formatDateTime,
} from "./_types"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DerivedStatus, { badge: React.ReactNode; border: string }> = {
  live: {
    border: "border-l-4 border-l-green-500",
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
    border: "border-l-4 border-l-blue-400",
    badge: (
      <Badge variant="secondary" className="gap-1 shrink-0">
        <CalendarClock className="h-3 w-3" />Upcoming
      </Badge>
    ),
  },
  past: {
    border: "border-l-4 border-l-border",
    badge: (
      <Badge variant="outline" className="gap-1 shrink-0">
        <CheckCircle2 className="h-3 w-3" />Ended
      </Badge>
    ),
  },
}

// ─── Score display ────────────────────────────────────────────────────────────

function ScoreDisplay({ test }: { test: CandidateTest }) {
  const { attempt, results_available } = test
  if (!attempt || attempt.status !== "submitted") return null

  if (!results_available) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Results pending release
      </div>
    )
  }

  if (attempt.score == null || attempt.total_marks == null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        Awaiting grading
      </div>
    )
  }

  const pct = attempt.percentage ?? Math.round((attempt.score / attempt.total_marks) * 100)
  const scoreColor =
    pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Score
        </span>
        <span className={cn("font-semibold tabular-nums", scoreColor)}>
          {attempt.score} / {attempt.total_marks}
          <span className="text-muted-foreground font-normal ml-1">({pct}%)</span>
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

// ─── Test Card ────────────────────────────────────────────────────────────────

function TestCard({ test }: { test: CandidateTest }) {
  const { border, badge } = STATUS_CONFIG[test.derived_status]
  const isInProgress = test.attempt?.status === "in_progress"
  const isSubmitted  = test.attempt?.status === "submitted"

  return (
    <Card className={cn("flex flex-col transition-shadow hover:shadow-md", border)}>
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

        {/* Score block */}
        <ScoreDisplay test={test} />

        {/* Past — not attempted */}
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

        {/* CTA */}
        <div className="mt-auto">
          {test.derived_status === "live" && !isSubmitted && (
            <Button
              asChild
              size="sm"
              variant={isInProgress ? "outline" : "default"}
              className="w-full sm:w-auto"
            >
              <Link href={`tests/${test.id}/attempt`}>
                {isInProgress ? (
                  <><RotateCcw className="h-4 w-4 mr-2" />Resume Test</>
                ) : (
                  <><PlayCircle className="h-4 w-4 mr-2" />Start Test</>
                )}
              </Link>
            </Button>
          )}

          {isSubmitted && test.results_available && (
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
              <Link href={`tests/${test.id}`}>
                <FileText className="h-4 w-4 mr-2" />View Result
              </Link>
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
      <BookOpen className="h-10 w-10 opacity-25" />
      <p className="text-sm">No {label} tests</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = "live" | "upcoming" | "past"

interface Props {
  tests: CandidateTest[]
}

export function CandidateTestsClient({ tests }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("live")

  const live     = tests.filter((t) => t.derived_status === "live")
  const upcoming = tests.filter((t) => t.derived_status === "upcoming")
  const past     = tests.filter((t) => t.derived_status === "past")

  const tabConfig = [
    { value: "live"     as const, label: "Live",     icon: <PlayCircle className="h-4 w-4 mr-2" />,    count: live.length },
    { value: "upcoming" as const, label: "Upcoming", icon: <CalendarClock className="h-4 w-4 mr-2" />, count: upcoming.length },
    { value: "past"     as const, label: "Past",     icon: <FileText className="h-4 w-4 mr-2" />,      count: past.length },
  ]

  const tabTests: Record<Tab, CandidateTest[]> = { live, upcoming, past }

  return (
    <div className="min-h-screen w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

        {/* Tab Bar */}
        <div className="w-full overflow-x-auto no-scrollbar pb-px border-b border-border">
          <TabsList variant="line" className="px-4 md:px-6 justify-start">
            {tabConfig.map(({ value, label, icon, count }) => (
              <TabsTrigger key={value} value={value}>
                {icon}{label}
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