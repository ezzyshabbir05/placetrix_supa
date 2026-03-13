"use client"

import * as React from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"


// ─── Constants ────────────────────────────────────────────────────────────────


const HOVER_OPEN_DELAY  = 90   // ms
const HOVER_CLOSE_DELAY = 140  // ms


// ─── Hover Context ────────────────────────────────────────────────────────────


interface SidebarHoverContextValue {
  /** Called by NavUser when its dropdown opens/closes */
  onUserMenuOpenChange: (open: boolean) => void
  /** Stable ref-based handlers — never cause re-renders in consumers */
  hoverProps: {
    onPointerEnter: (e: React.PointerEvent) => void
    onPointerLeave: (e: React.PointerEvent) => void
  }
}

export const SidebarHoverContext = React.createContext<SidebarHoverContextValue>({
  onUserMenuOpenChange: () => {},
  hoverProps: { onPointerEnter: () => {}, onPointerLeave: () => {} },
})

export function useSidebarHoverContext() {
  return React.useContext(SidebarHoverContext)
}


// ─── Mobile Hover Guard ───────────────────────────────────────────────────────
// Must be inside SidebarProvider to access useSidebar.


function MobileHoverGuard({
  suspendHoverRef,
}: {
  suspendHoverRef: React.MutableRefObject<boolean>
}) {
  const { isMobile } = useSidebar()

  React.useEffect(() => {
    suspendHoverRef.current = isMobile
  }, [isMobile, suspendHoverRef])

  return null
}


// ─── DashboardShell ───────────────────────────────────────────────────────────


export function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  const manualModeRef   = React.useRef(false)
  const hoverOpenedRef  = React.useRef(false)
  const suspendHoverRef = React.useRef(false)
  const intentTimerRef  = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIntentRef   = React.useRef<"open" | "close" | null>(null)

  const setOpenRef = React.useRef(setOpen)
  React.useEffect(() => { setOpenRef.current = setOpen }, [setOpen])

  const clearIntentTimer = React.useCallback(() => {
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current)
    intentTimerRef.current = null
    lastIntentRef.current = null
  }, [])

  React.useEffect(() => () => clearIntentTimer(), [clearIntentTimer])

  const commitIntent = React.useCallback((intent: "open" | "close") => {
    if (manualModeRef.current || suspendHoverRef.current) return
    if (intent === "open") {
      hoverOpenedRef.current = true
      setOpenRef.current(true)
    } else {
      if (!hoverOpenedRef.current) return
      hoverOpenedRef.current = false
      setOpenRef.current(false)
    }
  }, [])

  const scheduleIntent = React.useCallback((intent: "open" | "close") => {
    if (manualModeRef.current || suspendHoverRef.current) return
    if (lastIntentRef.current === intent) return
    lastIntentRef.current = intent
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current)
    const delay = intent === "open" ? HOVER_OPEN_DELAY : HOVER_CLOSE_DELAY
    intentTimerRef.current = setTimeout(() => {
      commitIntent(intent)
      intentTimerRef.current = null
      lastIntentRef.current = null
    }, delay)
  }, [commitIntent])

  const onManualToggle = React.useCallback(() => {
    clearIntentTimer()
    hoverOpenedRef.current = false
    setOpenRef.current((prev) => {
      if (prev) {
        manualModeRef.current = true
      } else {
        manualModeRef.current = false
      }
      return prev
    })
  }, [clearIntentTimer])

  React.useEffect(() => {
    if (open && manualModeRef.current) {
      manualModeRef.current = false
    }
  }, [open])

  const handleUserMenuOpenChange = React.useCallback(
    (menuOpen: boolean) => {
      suspendHoverRef.current = menuOpen
      if (menuOpen) {
        clearIntentTimer()
        setOpenRef.current(true)
      }
    },
    [clearIntentTimer],
  )

  const hoverProps = React.useMemo(() => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return
      scheduleIntent("open")
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return
      scheduleIntent("close")
    },
  }), [scheduleIntent])

  const contextValue = React.useMemo<SidebarHoverContextValue>(
    () => ({
      onUserMenuOpenChange: handleUserMenuOpenChange,
      hoverProps,
    }),
    [handleUserMenuOpenChange, hoverProps],
  )

  return (
    <SidebarHoverContext.Provider value={contextValue}>
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
      >
        {sidebar}

        {/* ✅ flex flex-col added so flex-1 children respond correctly */}
        <SidebarInset className="h-svh overflow-y-auto flex flex-col">
          <div className="sticky top-0 z-10 w-full bg-background border-b">
            <SiteHeader onManualToggle={onManualToggle} />
          </div>

          {/* ✅ min-h-0 prevents flex child from overflowing the parent */}
          <div className="flex flex-1 flex-col min-h-0">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 ">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>

        <MobileHoverGuard suspendHoverRef={suspendHoverRef} />
      </SidebarProvider>
    </SidebarHoverContext.Provider>
  )
}
