"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ─── Label map ────────────────────────────────────────────────────────────────
// Add every segment you want a custom label for. Anything not listed falls
// back to title-cased segment text (e.g. "job-postings" → "Job Postings").

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

/**
 * Converts a pathname like /~/job-postings/123 into breadcrumb segments.
 * Strips the leading "~" shell prefix — it carries no user-facing meaning.
 *
 * /~/home                → ["Home"]
 * /~/drives/abc-123      → ["Drives", "abc-123"]
 */
function useBreadcrumbs(): { label: string; href: string }[] {
    const pathname = usePathname()

    // Split, drop empty strings and the "~" shell segment
    const segments = pathname
        .split("/")
        .filter((s) => s && s !== "~")

    return segments.map((seg, idx) => ({
        label: toLabel(seg),
        // href reconstructs the path up to this segment (re-inserting "~")
        href: "/~/" + segments.slice(0, idx + 1).join("/"),
    }))
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
    onManualToggle: () => void
}

export function SiteHeader({ onManualToggle }: SiteHeaderProps) {
    const crumbs = useBreadcrumbs()

    return (
        <header className="flex h-[calc(var(--spacing)*10)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(var(--spacing)*10)]">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" onClick={onManualToggle} />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
                />

                <Breadcrumb>
                    <BreadcrumbList>
                        {crumbs.map((crumb, idx) => {
                            const isLast = idx === crumbs.length - 1
                            return (
                                <div key={crumb.href} className="flex items-center gap-1.5">
                                    {idx > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            // Current page — not a link
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <a
                                                href={crumb.href}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {crumb.label}
                                            </a>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            )
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    )
}
