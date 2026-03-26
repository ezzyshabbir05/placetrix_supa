// app/~/home/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-12" />
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export default function HomeLoading() {
  return (
    <div className="min-h-screen w-full">

      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">

        {/* Banner card */}
        <div className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 max-w-[200px]" />
            <Skeleton className="h-3 w-full max-w-[300px]" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md shrink-0 hidden sm:block" />
          <Skeleton className="h-8 w-8 rounded-md shrink-0 sm:hidden" />
        </div>

        {/* Section header + stat grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mt-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
