"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
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


function useBreadcrumbs(): { label: string; href: string }[] {
    const pathname = usePathname()
    const segments = pathname.split("/").filter((s) => s && s !== "~")

    return segments.map((seg, idx) => ({
        label: toLabel(seg),
        href: "/~/" + segments.slice(0, idx + 1).join("/"),
    }))
}


// ─── Constants ────────────────────────────────────────────────────────────────


/** How many crumbs to show before collapsing. Tune to taste. */
const ITEMS_TO_DISPLAY = 3


// ─── Component ────────────────────────────────────────────────────────────────


interface SiteHeaderProps {
    onManualToggle: () => void
}


export function SiteHeader({ onManualToggle }: SiteHeaderProps) {
    const crumbs = useBreadcrumbs()
    const [open, setOpen] = useState(false)

    const isCollapsed = crumbs.length > ITEMS_TO_DISPLAY
    const hiddenCrumbs = isCollapsed ? crumbs.slice(1, crumbs.length - 1) : []
    const visibleCrumbs = isCollapsed
        ? [crumbs[0], ...crumbs.slice(crumbs.length - 1)]
        : crumbs

    return (
        <header className="flex h-[calc(var(--spacing)*10)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(var(--spacing)*10)]">
            <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" onClick={onManualToggle} />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
                />

                {/* Render breadcrumbs only when there are segments to show */}
                {visibleCrumbs.length > 0 && (
                    <Breadcrumb className="min-w-0 flex-1">
                        <BreadcrumbList className="flex-nowrap">

                            {/* ── First crumb (always visible) ───────────────── */}
                            <BreadcrumbItem>
                                {visibleCrumbs.length === 1 ? (
                                    <BreadcrumbPage
                                        className="max-w-[8rem] truncate"
                                        title={visibleCrumbs[0].label}
                                    >
                                        {visibleCrumbs[0].label}
                                    </BreadcrumbPage>
                                ) : (
                                    <Link
                                        href={visibleCrumbs[0].href}
                                        className="max-w-[8rem] truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        title={visibleCrumbs[0].label}
                                    >
                                        {visibleCrumbs[0].label}
                                    </Link>
                                )}
                            </BreadcrumbItem>

                            {/* ── Ellipsis dropdown (only when collapsed) ─────── */}
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

                            {/* ── Remaining visible crumbs (last when collapsed) ── */}
                            {visibleCrumbs.slice(1).map((crumb, idx) => {
                                const absoluteIdx = isCollapsed
                                    ? crumbs.length - (visibleCrumbs.length - 1) + idx
                                    : idx + 1
                                const isLast = absoluteIdx === crumbs.length - 1

                                return (
                                    <span key={crumb.href} className="flex items-center gap-1.5">
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage
                                                    className="max-w-[12rem] truncate"
                                                    title={crumb.label}
                                                >
                                                    {crumb.label}
                                                </BreadcrumbPage>
                                            ) : (
                                                <Link
                                                    href={crumb.href}
                                                    className="max-w-[8rem] truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                                                    title={crumb.label}
                                                >
                                                    {crumb.label}
                                                </Link>
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                )
                            })}

                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>
        </header>
    )
}
