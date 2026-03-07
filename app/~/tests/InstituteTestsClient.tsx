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
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutList,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Clock,
  Users,
  FileQuestion,
  CalendarClock,
  MoreHorizontal,
  BookOpen,
  FlaskConical,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type InstituteTest,
  type InstituteTestStatus,
  formatDuration,
  formatDateTime,
} from "./_types"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InstituteTestStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-0",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0",
  },
  live: {
    label: "Live",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0",
  },
  past: {
    label: "Ended",
    className: "bg-secondary text-secondary-foreground border-0",
  },
}

const BORDER_CONFIG: Record<InstituteTestStatus, string> = {
  live:     "border-l-4 border-l-green-500",
  upcoming: "border-l-4 border-l-blue-400",
  past:     "border-l-4 border-l-border",
  draft:    "border-l-4 border-l-muted-foreground/30",
}

// ─── Test Card ────────────────────────────────────────────────────────────────

function TestCard({ test }: { test: InstituteTest }) {
  const { label, className } = STATUS_CONFIG[test.derived_status]
  const border = BORDER_CONFIG[test.derived_status]

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
          <Badge className={cn("shrink-0 text-xs font-medium", className)}>
            {label}
          </Badge>
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
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {formatDateTime(test.available_from)} → {formatDateTime(test.available_until)}
          </div>
        )}

        {/* Results toggle indicator */}
        {test.derived_status === "past" && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            test.results_available ? "text-green-600" : "text-muted-foreground"
          )}>
            {test.results_available
              ? <><Eye className="h-3 w-3" />Results visible to students</>
              : <><EyeOff className="h-3 w-3" />Results hidden from students</>}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto">
          <Separator className="mb-3" />
          <div className="flex items-center gap-2">

            <Button asChild variant="outline" size="sm">
              <Link href={`tests/${test.id}`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
              </Link>
            </Button>

            {test.attempt_count > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`tests/${test.id}/results`}>
                  <BarChart2 className="h-3.5 w-3.5 mr-1.5" />Results
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`tests/${test.id}`}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />Edit test
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {test.status === "published"
                    ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Unpublish</>
                    : <><Eye className="h-3.5 w-3.5 mr-2" />Publish</>}
                </DropdownMenuItem>
                {test.derived_status === "past" && (
                  <DropdownMenuItem>
                    {test.results_available
                      ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Hide results</>
                      : <><Eye className="h-3.5 w-3.5 mr-2" />Release results</>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
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

type Tab = "all" | "live" | "upcoming" | "past" | "drafts"

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

  const tabConfig = [
    { value: "all"      as const, label: "All",      icon: <LayoutList className="h-4 w-4 mr-2" />, count: tests.length },
    { value: "live"     as const, label: "Live",     icon: <BookOpen className="h-4 w-4 mr-2" />,   count: live.length },
    { value: "upcoming" as const, label: "Upcoming", icon: <CalendarClock className="h-4 w-4 mr-2" />, count: upcoming.length },
    { value: "past"     as const, label: "Past",     icon: null,                                     count: past.length },
    { value: "drafts"   as const, label: "Drafts",   icon: null,                                     count: drafts.length },
  ]

  const tabTests: Record<Tab, InstituteTest[]> = {
    all: tests,
    live,
    upcoming,
    past,
    drafts,
  }

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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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