"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarClock, PlayCircle, CheckCircle2,
  Clock, FileText, Trophy, AlertCircle, BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"



// ─── Placeholder data ─────────────────────────────────────────────────────────



const PLACEHOLDER_TESTS = [
  {
    id: "1",
    title: "Mid-Semester Assessment – Computer Science",
    description: "Covers data structures, algorithms, and OS fundamentals.",
    duration_minutes: 90,
    scheduled_start: "2026-03-10T10:00:00",
    status: "live" as const,
    submitted: false,
    score: null,
    total_marks: null,
  },
  {
    id: "2",
    title: "DBMS Unit Test – SQL & Normalisation",
    description: "Focuses on SQL queries, joins, and normalisation up to 3NF.",
    duration_minutes: 60,
    scheduled_start: "2026-03-15T09:00:00",
    status: "upcoming" as const,
    submitted: false,
    score: null,
    total_marks: null,
  },
  {
    id: "3",
    title: "Web Technologies – HTML/CSS/JS",
    description: "Practical assessment on frontend fundamentals.",
    duration_minutes: 45,
    scheduled_start: "2026-02-20T11:00:00",
    status: "past" as const,
    submitted: true,
    score: 38,
    total_marks: 45,
  },
  {
    id: "4",
    title: "Python Programming – OOP",
    description: null,
    duration_minutes: 60,
    scheduled_start: "2026-02-10T10:00:00",
    status: "past" as const,
    submitted: false,
    score: null,
    total_marks: null,
  },
    {
    id: "5",
    title: "Python Programming – OOP",
    description: null,
    duration_minutes: 60,
    scheduled_start: "2026-02-10T10:00:00",
    status: "past" as const,
    submitted: false,
    score: null,
    total_marks: null,
  },
    {
    id: "6",
    title: "Python Programming – OOP",
    description: null,
    duration_minutes: 60,
    scheduled_start: "2026-02-10T10:00:00",
    status: "past" as const,
    submitted: false,
    score: null,
    total_marks: null,
  },
]



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
  const borderClass = {
    live:     "border-l-4 border-l-green-500",
    upcoming: "border-l-4 border-l-blue-400",
    past:     "border-l-4 border-l-border",
  }[test.status]

  const statusBadge = {
    live: (
      <Badge className="gap-1 bg-green-500 hover:bg-green-500 border-0">
        <PlayCircle className="h-3 w-3" />Live
      </Badge>
    ),
    upcoming: (
      <Badge variant="secondary" className="gap-1">
        <CalendarClock className="h-3 w-3" />Upcoming
      </Badge>
    ),
    past: (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />Ended
      </Badge>
    ),
  }[test.status]

  return (
    <Card className={cn("transition-shadow hover:shadow-md", borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base leading-snug">{test.title}</CardTitle>
            {test.description && (
              <CardDescription className="line-clamp-2 text-xs">{test.description}</CardDescription>
            )}
          </div>
          <div className="shrink-0">{statusBadge}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(test.duration_minutes)}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDateTime(test.scheduled_start)}
          </span>
        </div>

        {/* Score — past + submitted */}
        {test.status === "past" && test.submitted && test.total_marks != null && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="h-4 w-4 text-amber-500" />
            Score:&nbsp;
            {test.score != null
              ? <span className="text-foreground">{test.score} / {test.total_marks}</span>
              : <span className="text-muted-foreground">Pending grading</span>}
          </div>
        )}

        {/* Not attempted — past */}
        {test.status === "past" && !test.submitted && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />Not attempted
          </p>
        )}

        {/* CTA — live */}
        {test.status === "live" && (
          <Button variant={"outline"} size="sm" className="w-full sm:w-auto" >
            <PlayCircle className="h-4 w-4 mr-2" />Start Test
          </Button>
        )}

        {/* Info — upcoming */}
        {test.status === "upcoming" && (
          <p className="text-xs text-muted-foreground">
            Opens {formatDateTime(test.scheduled_start)}
          </p>
        )}

      </CardContent>
    </Card>
  )
}



// ─── Empty State ──────────────────────────────────────────────────────────────



function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
      <BookOpen className="h-10 w-10 opacity-30" />
      <p className="text-sm">No {label} tests</p>
    </div>
  )
}



// ─── Component ────────────────────────────────────────────────────────────────



export function CandidateTestsClient() {
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "past">("live")

  const live     = PLACEHOLDER_TESTS.filter((t) => t.status === "live")
  const upcoming = PLACEHOLDER_TESTS.filter((t) => t.status === "upcoming")
  const past     = PLACEHOLDER_TESTS.filter((t) => t.status === "past")

  const tabConfig = [
    { value: "live",     label: "Live",     icon: <PlayCircle className="h-4 w-4 mr-2" />,    count: live.length },
    { value: "upcoming", label: "Upcoming", icon: <CalendarClock className="h-4 w-4 mr-2" />, count: upcoming.length },
    { value: "past",     label: "Past",     icon: <FileText className="h-4 w-4 mr-2" />,       count: past.length },
  ] as const

  const tabTests = { live, upcoming, past }

  return (
    <div className="min-h-screen w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>

        {/* ── Tab Bar ── */}
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

          {tabConfig.map(({ value }) => (
            <TabsContent key={value} value={value}>
              {tabTests[value].length === 0
                ? <EmptyState label={value} />
                : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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