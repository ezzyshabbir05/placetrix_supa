"use client"

import { cn } from "@/lib/utils"
import { useScroll } from "@/hooks/use-scroll"
import { Button } from "@/components/ui/button"
import React from "react"
import { MenuIcon, MoonIcon, SunIcon, XIcon } from "lucide-react"
import { Portal, PortalBackdrop } from "./ui/landing/portal"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserProfile } from "@/lib/supabase/profile"
import { getUserProfileAction } from "@/lib/supabase/profile"
import { buildStorageUrl } from "@/lib/storage"



// ─── Theme Toggle ─────────────────────────────────────────────────────────────



function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      size="icon"
      variant="ghost"
    >
      <SunIcon className="size-4.5 dark:hidden" />
      <MoonIcon className="hidden size-4.5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}



// ─── User Avatar ──────────────────────────────────────────────────────────────



function UserAvatar({ user }: { user: UserProfile }) {
  const initials = user.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  // Derive full URL from the stored path — handles both Supabase storage
  // paths and external OAuth URLs (Google, GitHub, etc.) transparently.
  const avatarUrl = buildStorageUrl("avatars", user.avatar_path)

  return (
    <Avatar className="size-7 border-2">
      <AvatarImage src={avatarUrl ?? undefined} alt={user.display_name} className="object-cover" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}



// ─── Auth Buttons ─────────────────────────────────────────────────────────────



function AuthButtons({ size }: { size: "sm" | "default" }) {
  return (
    <>
      <Button size={size} variant="outline">
        <Link href="/auth/login">Sign In</Link>
      </Button>
      <Button size={size}>
        <Link href="/auth/sign-up">Get Started</Link>
      </Button>
    </>
  )
}



// ─── Mobile Nav ───────────────────────────────────────────────────────────────



function MobileNav({ user }: { user: UserProfile | null }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="md:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle menu"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="outline"
      >
        {open ? (
          <XIcon className="size-4.5" />
        ) : (
          <MenuIcon className="size-4.5" />
        )}
      </Button>
      {open && (
        <Portal className="top-14" id="mobile-menu">
          <PortalBackdrop />
          <div
            className={cn(
              "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
              "size-full p-4"
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="mt-12 flex flex-col gap-2">
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
              {user ? (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <UserAvatar user={user} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.display_name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button className="w-full" variant="outline">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button className="w-full">
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}



// ─── Header ───────────────────────────────────────────────────────────────────



interface HeaderProps {
  user?: UserProfile | null
}

export function Header({ user: initialUser = null }: HeaderProps) {
  const [user, setUser] = React.useState<UserProfile | null>(initialUser);
  const scrolled = useScroll(10)

  // Client-side hydration for public (static) pages.
  // If the page was static, 'initialUser' is always null.
  React.useEffect(() => {
    if (initialUser) return;
    
    // Only attempt hydration if we think a session might exist locally.
    const hasAuthCookie = document.cookie.includes("auth-token");
    if (!hasAuthCookie) return;

    getUserProfileAction().then((data) => {
        if (data) setUser(data);
    }).catch(() => { /* skip if session revoked */ });
  }, [initialUser]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow":
            scrolled,
        }
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          { "md:px-2": scrolled }
        )}
      > 
      {/* font-bold p-2 */}
        <Link href="/" className="font-bold p-2">
          PlaceTrix
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <UserAvatar user={user} />
          ) : (
            <AuthButtons size="sm" />
          )}
        </div>

        {/* Mobile nav */}
        <MobileNav user={user} />
      </nav>
    </header>
  )
}
