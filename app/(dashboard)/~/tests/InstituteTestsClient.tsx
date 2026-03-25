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
  ListCheck,
  CalendarClock,
  FlaskConical,
  CheckCircle2,
  FileText,
  PlayCircle,
  PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InstituteTest, DerivedInstituteStatus } from "./_types"


// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "all" | "live" | "upcoming" | "past" | "drafts"

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

function StatusBadge({ status }: { status: DerivedInstituteStatus }) {
  switch (status) {
    case "live":
      return (
        <Badge className="gap-1.5 bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-[11px] px-2 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          Live
        </Badge>
      )
    case "upcoming":
      return (
        <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5">
          <CalendarClock className="h-3 w-3" />
          Upcoming
        </Badge>
      )
    case "past":
      return (
        <Badge variant="outline" className="gap-1 text-[11px] px-2 py-0.5 text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          Ended
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="gap-1 text-[11px] px-2 py-0.5 text-muted-foreground border-dashed">
          <PenLine className="h-3 w-3" />
          Draft
        </Badge>
      )
  }
}


// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
  )
}


// ─── Test Card ────────────────────────────────────────────────────────────────

function TestCard({ test }: { test: InstituteTest }) {
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
          <StatPill
            icon={<Clock className="h-3.5 w-3.5" />}
            label={test.time_limit_seconds ? formatDuration(test.time_limit_seconds) : "Untimed"}
          />
          <StatPill
            icon={<ListCheck className="h-3.5 w-3.5" />}
            label={
              test.question_count > 0
                ? `${test.question_count} question${test.question_count !== 1 ? "s" : ""}`
                : "No questions yet"
            }
          />
          <StatPill
            icon={<Users className="h-3.5 w-3.5" />}
            label={`${test.attempt_count} attempt${test.attempt_count !== 1 ? "s" : ""}`}
          />
        </div>

        {/* Schedule window */}
        {test.available_from || test.available_until ? (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {formatDateTime(test.available_from)}
              {test.available_until && (
                <> &rarr; {formatDateTime(test.available_until)}</>
              )}
            </span>
          </div>
        ) : (
          test.derived_status !== "draft" && (
            <div className="flex items-start gap-1.5 text-xs italic text-muted-foreground/60">
              <CalendarClock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>No schedule set — test is always available</span>
            </div>
          )
        )}

        {/* Results visibility (past only) */}
        {test.derived_status === "past" && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            test.results_available ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
          )}>
            {test.results_available
              ? <><Eye className="h-3.5 w-3.5 shrink-0" />Results visible to students</>
              : <><EyeOff className="h-3.5 w-3.5 shrink-0" />Results hidden</>
            }
          </div>
        )}

        {/* Upcoming note */}
        {test.derived_status === "upcoming" && (
          <p className="text-xs text-muted-foreground">
            {test.available_from
              ? <>Opens {formatDateTime(test.available_from)}</>
              : <span className="italic text-muted-foreground/60">Opening time not set</span>
            }
          </p>
        )}

        {/* Draft note */}
        {test.derived_status === "draft" && (
          <p className="text-xs text-muted-foreground italic">
            Not published — finish editing to go live
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

function EmptyState({ isFiltered, onCreate }: { isFiltered: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <FlaskConical className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {isFiltered ? "No tests in this category" : "No tests yet"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFiltered ? "Try switching tabs to view others" : "Create your first test to get started"}
        </p>
      </div>
      {!isFiltered && (
        <Button size="sm" onClick={onCreate} className="gap-1.5 mt-1">
          <Plus className="h-3.5 w-3.5" />
          Create Test
        </Button>
      )}
    </div>
  )
}


// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  tests: InstituteTest[]
}

export function InstituteTestsClient({ tests }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const router = useRouter()

  const live     = tests.filter((t) => t.derived_status === "live")
  const upcoming = tests.filter((t) => t.derived_status === "upcoming")
  const past     = tests.filter((t) => t.derived_status === "past")
  const drafts   = tests.filter((t) => t.derived_status === "draft")

  const tabConfig: TabConfig[] = [
    { value: "all",      label: "All",      icon: <LayoutList    className="h-3.5 w-3.5" />, count: tests.length    },
    { value: "live",     label: "Live",     icon: <PlayCircle    className="h-3.5 w-3.5" />, count: live.length     },
    { value: "upcoming", label: "Upcoming", icon: <CalendarClock className="h-3.5 w-3.5" />, count: upcoming.length },
    { value: "past",     label: "Past",     icon: <FileText      className="h-3.5 w-3.5" />, count: past.length     },
    { value: "drafts",   label: "Drafts",   icon: <PenLine       className="h-3.5 w-3.5" />, count: drafts.length   },
  ]

  const tabTests: Record<Tab, InstituteTest[]> = { all: tests, live, upcoming, past, drafts }

  const handleCreate = () => router.push("tests/new/edit")

  return (
    <div className="min-h-screen w-full">

      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">Tests</h1>
            <p className="text-sm text-muted-foreground">
              {tests.length} test{tests.length !== 1 ? "s" : ""} total
              {live.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {live.length} live
                </span>
              )}
            </p>
          </div>
          <Button size="sm" onClick={handleCreate} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Create Test
          </Button>
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
          {tabConfig.map(({ value }) => (
            <TabsContent key={value} value={value} className="mt-0 outline-none">
              {tabTests[value].length === 0 ? (
                <EmptyState isFiltered={value !== "all"} onCreate={handleCreate} />
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
