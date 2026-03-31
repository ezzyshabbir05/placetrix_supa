"use client"

import React, { useState } from "react"
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
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLabel(segment: string): string {
    return (
        SEGMENT_LABELS[segment] ??
        segment
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
    )
}

function useBreadcrumbs() {
    const pathname = usePathname()
    const { labels } = useBreadcrumbLabels()
    const allSegments = pathname.split("/").filter((s) => s && s !== "~")
    
    const crumbs: { label: string; href: string }[] = []
    let currentHref = "/~"

    for (const seg of allSegments) {
        currentHref += "/" + seg
        if (seg === "result") continue

        crumbs.push({
            label: labels[currentHref] ?? toLabel(seg),
            href: currentHref,
        })
    }

    return crumbs
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_TO_DISPLAY = 3

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
    onManualToggle: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteHeader({ onManualToggle }: SiteHeaderProps) {
    const crumbs = useBreadcrumbs()
    const [open, setOpen] = useState(false)

    const isCollapsed = crumbs.length > ITEMS_TO_DISPLAY

    // When collapsed: show first + last only; hide everything in between
    const firstCrumb  = crumbs[0]
    const lastCrumb   = crumbs[crumbs.length - 1]
    const hiddenCrumbs = isCollapsed ? crumbs.slice(1, -1) : []

    return (
        <header className="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" onClick={onManualToggle} />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
                />

                {crumbs.length > 0 && (
                    <Breadcrumb className="min-w-0 flex-1">
                        <BreadcrumbList className="flex-nowrap">

                            {/* ── First crumb (always visible) ── */}
                            <BreadcrumbItem>
                                {crumbs.length === 1 ? (
                                    <BreadcrumbPage className="max-w-32 truncate" title={firstCrumb.label}>
                                        {firstCrumb.label}
                                    </BreadcrumbPage>
                                ) : (
                                    <Link
                                        href={firstCrumb.href}
                                        className="max-w-32 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        title={firstCrumb.label}
                                    >
                                        {firstCrumb.label}
                                    </Link>
                                )}
                            </BreadcrumbItem>

                            {/* ── Ellipsis dropdown (only when collapsed) ── */}
                            {isCollapsed && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <DropdownMenu open={open} onOpenChange={setOpen}>
                                            <DropdownMenuTrigger
                                                className="flex items-center gap-1"
                                                aria-label="Show hidden breadcrumbs"
                                            >
                                                <BreadcrumbEllipsis className="size-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {hiddenCrumbs.map((crumb) => (
                                                    <DropdownMenuItem key={crumb.href} asChild>
                                                        <Link href={crumb.href}>{crumb.label}</Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                </>
                            )}

                            {/* ── Middle crumbs (non-collapsed) ── */}
                            {!isCollapsed && crumbs.slice(1, -1).map((crumb) => (
                                <React.Fragment key={`group-${crumb.href}`}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <Link
                                            href={crumb.href}
                                            className="max-w-32 truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            title={crumb.label}
                                        >
                                            {crumb.label}
                                        </Link>
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}

                            {/* ── Last crumb (always visible when >1 crumbs) ── */}
                            {crumbs.length > 1 && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="max-w-48 truncate" title={lastCrumb.label}>
                                            {lastCrumb.label}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}

                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
        </header>
    )
}
