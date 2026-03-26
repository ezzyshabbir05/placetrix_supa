// app/~/tests/loading.tsx

import { Skeleton } from "@/components/ui/skeleton"

// ─── Test Card Skeleton ───────────────────────────────────────────────────────
//
// Mirrors the real <TestCard>:
//   <Card>
//     <CardHeader pb-3>
//       flex justify-between: [title + description] | [status badge]
//     <CardContent flex-col gap-4>
//       meta row: icon pills (duration · questions/date · attempts)
//       schedule row
//       mt-auto: action button

function TestCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card flex flex-col">
      {/* CardHeader */}
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* title */}
            <Skeleton className="h-4 w-3/4" />
            {/* description — two lines */}
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {/* status badge */}
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
      </div>

      {/* CardContent */}
      <div className="flex flex-col flex-1 gap-4 p-6 pt-0">
        {/* meta row: duration · questions/date · attempts */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>

        {/* schedule row */}
        <Skeleton className="h-3.5 w-44" />

        {/* action button — mt-auto pushes to bottom */}
        <div className="mt-auto pt-0">
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export default function TestsLoading() {
  return (
    <div className="min-h-screen w-full">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      {/*
        Institute → flex justify-between: [title + subtitle] | [Create Test button]
        Candidate → just [title + subtitle]  (no button)
        We always render the button skeleton — harmless on candidate, correct on institute.
      */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
          {/* Institute "Create Test" button */}
          <Skeleton className="h-8 w-28 rounded-md shrink-0" />
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────────── */}
      {/*
        Exact mirror of both clients:
          <div className="overflow-x-auto px-4 pt-5 md:px-8">
            <TabsList className="inline-flex h-9 gap-0.5 rounded-lg bg-muted p-1">
              <TabsTrigger className="gap-1.5 rounded-md px-3 text-xs ...">
                {label}
                <span> {count badge} </span>   ← optional pill next to label

        Institute tabs : All | Live | Upcoming | Past | Drafts  (5 tabs)
        Candidate tabs : Live | Upcoming | Past                  (3 tabs)

        Use 5 pills to cover the institute layout (worst case).
        Each pill width = label text width + optional count badge at text-xs px-3.
        Approximate real rendered widths:
          "All"      px-3 → ~44px   + badge ~20px → ~72px total
          "Live"     px-3 → ~50px   + badge ~20px → ~78px total
          "Upcoming" px-3 → ~76px   + badge ~20px → ~104px total
          "Past"     px-3 → ~48px   + badge ~20px → ~76px total
          "Drafts"   px-3 → ~58px   + badge ~20px → ~86px total
      */}
      <div className="overflow-x-auto px-4 pt-5 md:px-8">
        <div className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-1">
          <Skeleton className="h-7 w-[52px]  rounded-md shrink-0" />
          <Skeleton className="h-7 w-[58px]  rounded-md shrink-0" />
          <Skeleton className="h-7 w-[84px]  rounded-md shrink-0" />
          <Skeleton className="h-7 w-[56px]  rounded-md shrink-0" />
          <Skeleton className="h-7 w-[64px]  rounded-md shrink-0" />
        </div>
      </div>

      {/* ── Card Grid ────────────────────────────────────────────────────────── */}
      {/*
        Matches: <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        Show 8 cards to fill the grid at any breakpoint without looking sparse.
      */}
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