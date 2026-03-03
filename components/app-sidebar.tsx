"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
    Icon, IconBell, IconBriefcase, IconBuildingSkyscraper, IconChartBar,
    IconClipboardList, IconDashboard, IconDotsVertical, IconFileDescription,
    IconFolder, IconHelp, IconHome, IconLogout, IconNotification, IconReport,
    IconSearch, IconSettings, IconShieldCheck, IconUser, IconUserCircle,
    IconUsers, IconUsersGroup, IconCreditCard, IconCalendarEvent, IconSchool,
    IconBriefcase2, IconFileAnalytics, IconTargetArrow,
} from "@tabler/icons-react"
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
    SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
    SidebarMenuItem, SidebarMenuSkeleton, useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AccountType, UserProfile } from "@/lib/supabase/profile"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"


// ─── Role-based nav definitions ──────────────────────────────────────────────

type NavItem = {
    title: string
    url: string
    icon: Icon
}

const VALID_ACCOUNT_TYPES: AccountType[] = ["candidate", "institute", "admin", "recruiter"]

const NAV_MAIN: Record<AccountType, NavItem[]> = {
    candidate: [
        { title: "Home", url: "/~/home", icon: IconHome },
        { title: "Job Search", url: "/~/jobs", icon: IconSearch },
        { title: "My Applications", url: "/~/applications", icon: IconClipboardList },
        { title: "Tests", url: "/~/tests", icon: IconChartBar },
        { title: "Resume", url: "/~/resume", icon: IconFileDescription },
        { title: "Events", url: "/~/events", icon: IconCalendarEvent },
    ],
    institute: [
        { title: "Home", url: "/~/home", icon: IconHome },
        { title: "Students", url: "/~/students", icon: IconSchool },
        { title: "Drives", url: "/~/drives", icon: IconFolder },
        { title: "Tests", url: "/~/tests", icon: IconChartBar },
        { title: "Reports", url: "/~/reports", icon: IconReport },
        { title: "Recruiters", url: "/~/recruiters", icon: IconBriefcase },
    ],
    admin: [
        { title: "Home", url: "/~/home", icon: IconHome },
        { title: "Users", url: "/~/users", icon: IconUsers },
        { title: "Groups", url: "/~/groups", icon: IconUsersGroup },
        { title: "Drives", url: "/~/drives", icon: IconFolder },
        { title: "Tests", url: "/~/tests", icon: IconChartBar },
        { title: "Events", url: "/~/events", icon: IconCalendarEvent },
        { title: "Analytics", url: "/~/analytics", icon: IconFileAnalytics },
        { title: "Reports", url: "/~/reports", icon: IconReport },
    ],
    recruiter: [
        { title: "Home", url: "/~/home", icon: IconHome },
        { title: "Job Postings", url: "/~/postings", icon: IconBriefcase2 },
        { title: "Candidates", url: "/~/candidates", icon: IconTargetArrow },
        { title: "Drives", url: "/~/drives", icon: IconFolder },
        { title: "Tests", url: "/~/tests", icon: IconChartBar },
        { title: "Reports", url: "/~/reports", icon: IconReport },
    ],
}

const NAV_SECONDARY: NavItem[] = [
    { title: "Notifications", url: "/~/notifications", icon: IconBell },
    { title: "Settings", url: "/~/settings", icon: IconSettings },
    { title: "Get Help", url: "/~/help", icon: IconHelp },
]

const ROLE_LABELS: Record<AccountType, string> = {
    candidate: "Candidate",
    institute: "Institute",
    admin: "Admin",
    recruiter: "Recruiter",
}

const ROLE_COLORS: Record<AccountType, string> = {
    candidate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    institute: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    recruiter: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Guards against a corrupt/missing account_type value in the DB row. */
function safeAccountType(type: string | null | undefined): AccountType {
    return VALID_ACCOUNT_TYPES.includes(type as AccountType)
        ? (type as AccountType)
        : "candidate"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function NavUser({ user }: { user: UserProfile }) {
    const { isMobile } = useSidebar()
    const router = useRouter()

    // ── Fallbacks ──
    const displayName = user.display_name?.trim() || "Unknown User"
    const email = user.email?.trim() || "No email"
    const accountType = safeAccountType(user.account_type)
    const initials = displayName !== "Unknown User"
        ? displayName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "??"

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg grayscale">
                                <AvatarImage src={user.avatar_url ?? undefined} alt={displayName} />
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{displayName}</span>
                                <span className="truncate text-xs text-muted-foreground">{email}</span>
                            </div>
                            <IconDotsVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar_url ?? undefined} alt={displayName} />
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{displayName}</span>
                                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <div className="px-2 py-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[accountType]}`}>
                                {ROLE_LABELS[accountType]}
                            </span>
                        </div>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <IconUserCircle />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconCreditCard />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconNotification />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                            <IconLogout />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export function NavMain({ items }: { items: NavItem[] }) {
    const pathname = usePathname()
    const { setOpenMobile } = useSidebar()

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild
                                // Exact match for the item URL, or a child route
                                isActive={
                                    pathname === item.url ||
                                    pathname.startsWith(item.url + "/")
                                }
                            >
                                <Link
                                    href={item.url}
                                    // Close the mobile drawer on navigation
                                    onClick={() => setOpenMobile(false)}
                                >
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

export function NavSecondary({
    items,
    ...props
}: {
    items: NavItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const pathname = usePathname()
    const { setOpenMobile } = useSidebar()

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={
                                    pathname === item.url ||
                                    pathname.startsWith(item.url + "/")
                                }
                            >
                                <Link href={item.url} onClick={() => setOpenMobile(false)}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Rendered by Suspense in the layout while getUserProfile() is in-flight.
 * Uses shadcn's built-in SidebarMenuSkeleton (showIcon variant) for nav rows,
 * and plain Skeleton for the logo + footer user tile.
 */
export function AppSidebarSkeleton() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2 p-1.5">
                            <Skeleton className="size-5 rounded-md shrink-0" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main nav skeleton – 6 rows */}
                <SidebarGroup>
                    <SidebarGroupContent className="flex flex-col gap-2">
                        <SidebarMenu>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SidebarMenuItem key={i}>
                                    <SidebarMenuSkeleton showIcon />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Secondary nav skeleton – 3 rows, pushed to bottom */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <SidebarMenuItem key={i}>
                                    <SidebarMenuSkeleton showIcon />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer user tile skeleton */}
            <SidebarFooter>
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-4 w-4 rounded shrink-0" />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: UserProfile
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const accountType = safeAccountType(user.account_type)
    const mainNav = NAV_MAIN[accountType]

    return (
        <Sidebar collapsible="icon" variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5 group/logo cursor-pointer hover:bg-transparent hover:text-current active:bg-transparent focus:bg-transparent">
                            <Image
                                src="/placetrix.svg"
                                alt="PlaceTrix"
                                width={25}
                                height={25}
                                className="size-5.5! dark:invert dark:brightness-0 dark:contrast-100 transition-all duration-300 group-hover/logo:scale-110 group-hover/logo:rotate-[-6deg] group-hover/logo:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                            />
                            <span className="text-base font-bold transition-all duration-300 group-hover/logo:tracking-wider">
                                PlaceTrix
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNav} />
                <NavSecondary items={NAV_SECONDARY} className="mt-auto" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
