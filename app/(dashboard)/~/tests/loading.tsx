// app/~/tests/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

// ─── Card Skeleton ────────────────────────────────────────────────────────────

function TestCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full shrink-0" />
      </div>

      {/* Meta pills */}
      <div className="flex gap-4">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-14" />
      </div>

      {/* Schedule row */}
      <Skeleton className="h-3.5 w-40" />

      {/* Action button */}
      <Skeleton className="h-8 w-24 rounded-md mt-auto" />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export default function TestsLoading() {
  return (
    <div className="min-h-screen w-full">

      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          {/* Create Test button (institute only – harmless for candidates) */}
          <Skeleton className="h-8 w-28 rounded-md shrink-0" />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="overflow-hidden px-4 pt-5 md:px-8">
        <div className="flex h-9 gap-0.5 rounded-lg bg-muted p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-7 shrink-0 rounded-md"
              style={{ width: `${[52, 52, 76, 52, 60][i]}px` }}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-6 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TestCardSkeleton key={i} />
          ))}
        </div>
      </div>

    </div>
  )
}