"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useBreadcrumbLabels } from "@/components/breadcrumb-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"



// ─── Label map ────────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
    home:          "Home",
    jobs:          "Job Search",
    applications:  "My Applications",
    tests:         "Tests",
    resume:        "Resume",
    events:        "Events",
    students:      "Students",
    drives:        "Drives",
    reports:       "Reports",
    recruiters:    "Recruiters",
    users:         "Users",
    groups:        "Groups",
    analytics:     "Analytics",
    postings:      "Job Postings",
    candidates:    "Candidates",
    notifications: "Notifications",
    settings:      "Settings",
    help:          "Get Help",
    result:        "Results",
    edit:          "Settings",
    new:           "New",
    attempt:       "Attempt",
    preview:       "Preview",
    details:       "Details",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLabel(segment: string): string {
    return (
        SEGMENT_LABELS[segment.toLowerCase()] ??
        segment
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
    )
}

function isId(segment: string): boolean {
    // UUID regex: matches standard 8-4-4-4-12 UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    // Numeric ID: starts with a digit and is completely numeric (common for serial IDs)
    const numericRegex = /^\d+$/
    // Long alphanumeric (15+ chars) that aren't keywords - likely a NanoID or similar
    const longAlphanumericRegex = /^[a-zA-Z0-9_-]{15,}$/
    
    return (
        uuidRegex.test(segment) || 
        numericRegex.test(segment) || 
        (longAlphanumericRegex.test(segment) && !SEGMENT_LABELS[segment.toLowerCase()])
    )
}

function useBreadcrumbs() {
    const pathname = usePathname()
    const { labels } = useBreadcrumbLabels()
    const allSegments = pathname.split("/").filter((s) => s && s !== "~")
    
    const crumbs: { label: string; href: string; isLoading: boolean }[] = []
    let currentHref = "/~"

    for (const seg of allSegments) {
        currentHref += "/" + seg
        if (seg === "result") continue

        const label = labels[currentHref]
        const isKnownStatic = !!SEGMENT_LABELS[seg.toLowerCase()]
        const looksLikeId = isId(seg)

        crumbs.push({
            label: label ?? toLabel(seg),
            href: currentHref,
            isLoading: !label && !isKnownStatic && looksLikeId,
        })
    }

    return crumbs
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
    onManualToggle: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteHeader({ onManualToggle }: SiteHeaderProps) {
    const crumbs = useBreadcrumbs()
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                left: scrollRef.current.scrollWidth,
                behavior: "smooth",
            })
        }
    }, [crumbs])

    return (
        <header className="flex h-10 w-full min-w-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" onClick={onManualToggle} />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
                />

                {crumbs.length > 0 && (
                    <Breadcrumb 
                        ref={scrollRef}
                        className="min-w-0 flex-1 overflow-x-auto scroll-smooth"
                    >
                        <BreadcrumbList className="flex-nowrap pr-8">
                            {crumbs.map((crumb, idx) => (
                                <React.Fragment key={crumb.href}>
                                    {idx > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {idx === crumbs.length - 1 ? (
                                            <BreadcrumbPage className="whitespace-nowrap">
                                                {crumb.isLoading ? (
                                                    <Skeleton className="h-4 w-24" />
                                                ) : (
                                                    crumb.label
                                                )}
                                            </BreadcrumbPage>
                                        ) : (
                                            <Link
                                                href={crumb.href}
                                                className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {crumb.isLoading ? (
                                                    <Skeleton className="h-4 w-20" />
                                                ) : (
                                                    crumb.label
                                                )}
                                            </Link>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
        </header>
    )
}
