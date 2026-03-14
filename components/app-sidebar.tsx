"use client"
import PlaceTrixLogo from "@/assets/placetrix.svg"
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
  IconSun, IconMoon, IconDeviceLaptop, IconCheck,
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
import { useSidebarHoverContext } from "@/components/dashboard-shell"
import { useTheme } from "next-themes"
import { buildStorageUrl } from "@/lib/storage"




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



// ─── Theme options ────────────────────────────────────────────────────────────



type ThemeOption = { value: string; label: string; icon: Icon }

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceLaptop },
]



// ─── Helpers ──────────────────────────────────────────────────────────────────



const VALID_ACCOUNT_TYPE_SET = new Set<string>(VALID_ACCOUNT_TYPES)

function safeAccountType(type: string | null | undefined): AccountType {
  return VALID_ACCOUNT_TYPE_SET.has(type ?? "")
    ? (type as AccountType)
    : "candidate"
}

const MAX_PRIMARY_NAV_COUNT = Math.max(
  ...VALID_ACCOUNT_TYPES.map((t) => NAV_MAIN[t].length)
)



// ─── NavUser ──────────────────────────────────────────────────────────────────



export function NavUser({ user }: { user: UserProfile | null }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { onUserMenuOpenChange } = useSidebarHoverContext()
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const displayName = user?.display_name?.trim() || "User"
  const email = user?.email?.trim() || "No email"
  const sidebarSubtitle = user?.username?.trim()
    ? `@${user.username.trim()}`
    : email
  const accountType = safeAccountType(user?.account_type)
  const initials = user?.display_name?.trim()
    ? displayName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.trim()[0]?.toUpperCase() ?? "?")

  // Derive full URL from stored path once — works for both Supabase storage
  // paths AND external OAuth avatar URLs (Google, GitHub, etc.)
  const avatarUrl = buildStorageUrl("avatars", user?.avatar_path ?? null)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          onOpenChange={onUserMenuOpenChange}
          modal={false}
        >
          <DropdownMenuTrigger asChild disabled={!user}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {user ? (
                <>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{sidebarSubtitle}</span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4" />
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded shrink-0 ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {user && (
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
              onPointerEnter={() => onUserMenuOpenChange(true)}
              onPointerLeave={() => onUserMenuOpenChange(false)}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* ── User identity header ───────────────────── */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* ── Account / billing / notifications ─────── */}
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <IconUserCircle />
                  Account{" "}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[accountType]}`}>
                    {ROLE_LABELS[accountType]}
                  </span>
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

              {/* ── Theme selector ─────────────────────────── */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Appearance
                </DropdownMenuLabel>
                {THEME_OPTIONS.map(({ value, label, icon: ThemeIcon }) => {
                  const isActive = mounted && theme === value
                  return (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setTheme(value)}
                      className="cursor-pointer"
                    >
                      <ThemeIcon className="size-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {isActive && (
                        <IconCheck className="ml-auto size-3.5 text-primary" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* ── Logout ─────────────────────────────────── */}
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}



// ─── NavMain ──────────────────────────────────────────────────────────────────



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



// ─── NavSecondary ─────────────────────────────────────────────────────────────



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



// ─── AppSidebar ───────────────────────────────────────────────────────────────



interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserProfile | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const accountType = safeAccountType(user?.account_type)
  const mainNav = user ? NAV_MAIN[accountType] : null
  const { hoverProps } = useSidebarHoverContext()

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...hoverProps}
      {...props}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5! group/logo cursor-pointer hover:bg-transparent hover:text-current active:bg-transparent focus:bg-transparent">
                <Image
                  src={PlaceTrixLogo}
                  alt="PlaceTrix"
                  width={25}
                  height={25}
                  className="size-5.5! dark:invert ..."
                />
                <span className="text-base font-bold transition-all duration-300 group-hover/logo:tracking-wider">
                  PlaceTrix
                </span>
              </SidebarMenuButton>
            ) : (
              <div className="flex items-center gap-2 p-1.5">
                <Skeleton className="size-5.5 rounded-md shrink-0" />
                <Skeleton className="h-5 w-24" />
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ──────────────────────────────────────── */}
      <SidebarContent>
        {mainNav ? (
          <NavMain items={mainNav} />
        ) : (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {Array.from({ length: MAX_PRIMARY_NAV_COUNT }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user ? (
          <NavSecondary items={NAV_SECONDARY} className="mt-auto" />
        ) : (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: NAV_SECONDARY.length }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ───────────────────────────────────────── */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
