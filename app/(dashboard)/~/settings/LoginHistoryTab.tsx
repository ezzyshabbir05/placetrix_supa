"use client"

import { useState, useEffect, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  LogOut,
  MapPin,
  Clock,
  Loader2,
  ShieldAlert,
  CalendarClock,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionEntry {
  id: string
  created_at: string | null
  updated_at: string | null
  not_after: string | null
  ip: string | null
  user_agent: string | null
}

interface ParsedUA {
  browser: string
  os: string
  device: "desktop" | "mobile" | "tablet"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): ParsedUA {
  if (!ua) return { browser: "Unknown Browser", os: "Unknown OS", device: "desktop" }

  let browser = "Unknown Browser"
  let os = "Unknown OS"
  let device: "desktop" | "mobile" | "tablet" = "desktop"

  if (ua.includes("Edg/") || ua.includes("EdgA/") || ua.includes("Edge/"))
    browser = "Edge"
  else if (ua.includes("SamsungBrowser/"))
    browser = "Samsung Browser"
  else if (ua.includes("OPR/") || ua.includes("Opera/"))
    browser = "Opera"
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/"))
    browser = "Chrome"
  else if (ua.includes("Firefox/") || ua.includes("FxiOS/"))
    browser = "Firefox"
  else if (ua.includes("Safari/") && !ua.includes("Chrome/"))
    browser = "Safari"
  else if (ua.includes("MSIE") || ua.includes("Trident/"))
    browser = "Internet Explorer"

  if (ua.includes("iPhone")) {
    os = "iOS"
    device = "mobile"
  } else if (ua.includes("iPad")) {
    os = "iPadOS"
    device = "tablet"
  } else if (ua.includes("Android")) {
    os = "Android"
    device = ua.includes("Mobile") ? "mobile" : "tablet"
  } else if (ua.includes("Windows NT")) {
    os = "Windows"
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) {
    os = "macOS"
  } else if (ua.includes("CrOS")) {
    os = "ChromeOS"
  } else if (ua.includes("Linux")) {
    os = "Linux"
  }

  return { browser, os, device }
}

function getSessionIdFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.session_id ?? null
  } catch {
    return null
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Unknown"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatExpiryDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  if (date < now) return null
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isExpired(not_after: string | null): boolean {
  if (!not_after) return false
  return new Date(not_after) < new Date()
}

function DeviceIcon({ device }: { device: "desktop" | "mobile" | "tablet" }) {
  if (device === "mobile") return <Smartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
  if (device === "tablet") return <Tablet className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
  return <Monitor className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
}

// ── Skeleton: no individual borders, just stacked rows with dividers ──────────
function SessionSkeleton() {
  return (
    <div className="divide-y">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3"
          style={{ opacity: 1 - (i - 1) * 0.2 }}
        >
          <div className="h-5 w-5 rounded bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-44 rounded bg-muted animate-pulse" />
            <div className="h-3 w-60 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LoginHistoryTabProps {
  supabase: SupabaseClient
  cardDescription?: string
}

export function LoginHistoryTab({
  supabase,
  cardDescription = "Recent access to your account",
}: LoginHistoryTabProps) {
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        setSessions([])
        return
      }

      const userId = session.user.id

      if (session.access_token) {
        setCurrentSessionId(getSessionIdFromJwt(session.access_token))
      }

      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, created_at, updated_at, not_after, ip, user_agent")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setSessions(data ?? [])
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load login history.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId)
    try {
      const { error } = await supabase.rpc("revoke_session", { p_session_id: sessionId })
      if (error) throw error
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      toast.success("Session revoked successfully.")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message ?? "Failed to revoke session.")
    } finally {
      setRevokingId(null)
    }
  }

  async function handleRevokeAll() {
    const others = sessions.filter((s) => s.id !== currentSessionId)
    if (others.length === 0) {
      toast.info("No other active sessions to revoke.")
      return
    }
    setRevokingAll(true)
    let successCount = 0
    let failCount = 0
    for (const s of others) {
      try {
        const { error } = await supabase.rpc("revoke_session", { p_session_id: s.id })
        if (error) throw error
        successCount++
        setSessions((prev) => prev.filter((x) => x.id !== s.id))
      } catch {
        failCount++
      }
    }
    setRevokingAll(false)
    if (failCount === 0)
      toast.success(`${successCount} other session${successCount !== 1 ? "s" : ""} revoked successfully.`)
    else
      toast.warning(`${successCount} revoked, ${failCount} failed.`)
  }

  const otherCount = sessions.filter((s) => s.id !== currentSessionId).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Login History</CardTitle>
              <CardDescription>{cardDescription}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">

          {/* ── Revoke-All Banner ─────────────────────────────────────────── */}
          {!loading && otherCount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium truncate">
                  {otherCount} other active session{otherCount !== 1 ? "s" : ""} detected
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={revokingAll} className="shrink-0">
                    {revokingAll ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Revoke All Others
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately sign out{" "}
                      <strong>{otherCount} other device{otherCount !== 1 ? "s" : ""}</strong>.
                      Your current session will remain active.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleRevokeAll}
                    >
                      Yes, Revoke All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* ── Loading Skeleton ──────────────────────────────────────────── */}
          {loading && <SessionSkeleton />}

          {/* ── Empty State ───────────────────────────────────────────────── */}
          {!loading && sessions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No login history found.
            </p>
          )}

          {/* ── Session Rows ──────────────────────────────────────────────── */}
          {!loading && (
            // ↓ divide-y replaces the per-row border
            <div className="divide-y">
              {sessions.map((session) => {
                const { browser, os, device } = parseUserAgent(session.user_agent)
                const isCurrent = session.id === currentSessionId
                const expired = isExpired(session.not_after)
                const expiryLabel = formatExpiryDate(session.not_after)
                const isRevoking = revokingId === session.id

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "flex items-start justify-between gap-3 py-3",
                      // subtle left accent replaces the full row border for "current"
                      expired && !isCurrent && "opacity-55"
                    )}
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <DeviceIcon device={device} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {browser} · {os}
                          </p>
                          {isCurrent && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Current
                            </span>
                          )}
                          {expired && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              Expired
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {session.ip && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {session.ip}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Signed in {formatTimeAgo(session.created_at)}
                          </span>
                          {session.updated_at && session.updated_at !== session.created_at && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <RefreshCw className="h-3 w-3" />
                              Active {formatTimeAgo(session.updated_at)}
                            </span>
                          )}
                          {expiryLabel && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="h-3 w-3" />
                              Expires {expiryLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: revoke button */}
                    {!isCurrent && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isRevoking || revokingAll}
                            className="shrink-0 text-destructive hover:border-destructive/50 hover:text-destructive"
                          >
                            {isRevoking ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <LogOut className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5 hidden sm:inline">Revoke</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke This Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The device using{" "}
                              <strong>{browser} on {os}</strong>
                              {session.ip ? ` (IP: ${session.ip})` : ""} will be signed out
                              immediately. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleRevoke(session.id)}
                            >
                              Yes, Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
