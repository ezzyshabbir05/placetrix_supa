// app/~/settings/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen w-full">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <Skeleton className="h-6 w-28 mb-1.5" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 md:px-8 overflow-hidden">
        <div className="flex h-9 gap-0.5 rounded-lg bg-muted p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 shrink-0 rounded-md" />
          ))}
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">

        {/* ── Account Settings (Username) Card ── */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-4 w-64 mb-5" />
          <div className="max-w-sm space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-3.5 w-72" />
          </div>
        </div>

        {/* ── Avatar / Logo Card ── */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-56 mb-5" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          </div>
        </div>

        {/* ── Basic / Personal Info Card ── */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-60 mb-5" />

          {/* 3-col row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* 3-col row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* Single field */}
          <div className="mb-4">
            <FieldSkeleton />
          </div>

          {/* Textarea */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          {/* Textarea with header row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>

        {/* ── Education Details Card ── */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-4 w-56 mb-5" />

          {/* Institution */}
          <div className="mb-4">
            <FieldSkeleton />
          </div>

          {/* 2-col row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          <Skeleton className="h-px w-full mb-4" />

          {/* 2-col row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6 mb-4">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>

          <Skeleton className="h-px w-full mb-4" />

          {/* PRN */}
          <div className="mb-4">
            <FieldSkeleton />
          </div>

          {/* SGPA grid */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FieldSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Professional Info Card ── */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-44 mb-1" />
          <Skeleton className="h-4 w-52 mb-5" />

          {/* Resume */}
          <div className="mb-4">
            <FieldSkeleton />
          </div>

          <Skeleton className="h-px w-full mb-4" />

          {/* Skills */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          <Skeleton className="h-px w-full mb-4" />

          {/* 2-col links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>

          {/* Portfolio links */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Shared micro-skeleton for a label + input pair ───────────────────────────

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
}