"use client"

import * as React from "react"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"


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


// ─── Site Header ──────────────────────────────────────────────────────────────


function SiteHeader({ onManualToggle }: { onManualToggle: () => void }) {
    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" onClick={onManualToggle} />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-base font-medium">Dashboard</h1>
            </div>
        </header>
    )
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
        // FIX #5 complement: also suspend hover entirely on mobile/touch
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
    // Only piece of state that drives the controlled sidebar — nothing else.
    const [open, setOpen] = React.useState(false)

    // ── All mutable, non-reactive bits live in refs (FIX #3, #4) ──────────────
    // Moving these out of state/useCallback dependency chains means:
    //   • context value never rebuilds on suspendHover changes
    //   • hoverProps object identity is permanently stable
    //   • no re-render cascade through AppSidebar on every menu open/close

    const manualModeRef    = React.useRef(false)  // true after SidebarTrigger click
    const hoverOpenedRef   = React.useRef(false)  // true only when hover opened sidebar
    const suspendHoverRef  = React.useRef(false)  // FIX #1: read by timer closures — always current
    const intentTimerRef   = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastIntentRef    = React.useRef<"open" | "close" | null>(null)

    // Stable setter ref so timer closures can call setOpen without being
    // listed as a dependency (setOpen is already stable from useState).
    const setOpenRef = React.useRef(setOpen)
    React.useEffect(() => { setOpenRef.current = setOpen }, [setOpen])


    // ── Timer helpers ──────────────────────────────────────────────────────────

    const clearIntentTimer = React.useCallback(() => {
        if (intentTimerRef.current) clearTimeout(intentTimerRef.current)
        intentTimerRef.current = null
        lastIntentRef.current  = null
    }, []) // no deps — only touches refs


    React.useEffect(() => () => clearIntentTimer(), [clearIntentTimer])


    // ── Commit (FIX #1: reads suspendHoverRef.current, not stale closure) ─────

    const commitIntent = React.useCallback((intent: "open" | "close") => {
        // FIX #1: suspendHoverRef.current is always the latest value, even inside
        // a timer callback that was scheduled before the flag changed.
        if (manualModeRef.current || suspendHoverRef.current) return

        if (intent === "open") {
            hoverOpenedRef.current = true
            setOpenRef.current(true)
        } else {
            if (!hoverOpenedRef.current) return
            hoverOpenedRef.current = false
            setOpenRef.current(false)
        }
    }, []) // truly stable — zero reactive deps


    // ── Schedule ───────────────────────────────────────────────────────────────

    const scheduleIntent = React.useCallback((intent: "open" | "close") => {
        if (manualModeRef.current || suspendHoverRef.current) return
        if (lastIntentRef.current === intent) return

        lastIntentRef.current = intent
        if (intentTimerRef.current) clearTimeout(intentTimerRef.current)

        const delay = intent === "open" ? HOVER_OPEN_DELAY : HOVER_CLOSE_DELAY
        intentTimerRef.current = setTimeout(() => {
            commitIntent(intent)
            intentTimerRef.current = null
            lastIntentRef.current  = null
        }, delay)
    }, [commitIntent]) // commitIntent is stable, so scheduleIntent is stable too


    // ── Manual toggle (FIX #2) ─────────────────────────────────────────────────
    // Previous: useEffect reset manualModeRef on the same cycle as the close,
    // letting hover immediately re-open after a manual close.
    //
    // Fix: we track the *intended* final state when the user clicks the trigger.
    // • If the sidebar was hover-opened → user is force-closing → lock it closed
    //   by setting manualModeRef = true and NOT clearing it in the open watcher.
    // • If the sidebar was manually-opened → user is toggling closed → same lock.
    // • If the sidebar was closed → user is opening manually → normal manual mode.
    //
    // manualModeRef is only released when the user explicitly opens via trigger
    // again (transitioning false → true while in manual mode).

    const onManualToggle = React.useCallback(() => {
        clearIntentTimer()
        hoverOpenedRef.current = false  // prevent commitIntent("close") from no-op'ing

        // Read current open state to know which direction the toggle is going.
        // We capture it via a callback form of setOpen to avoid a stale closure.
        setOpenRef.current((prev) => {
            if (prev) {
                // Closing manually → engage lock so hover can't re-open immediately
                manualModeRef.current = true
            } else {
                // Opening manually → disengage lock (hover won't auto-close a
                // manually opened sidebar — that's handled by hoverOpenedRef = false)
                manualModeRef.current = false
            }
            // Return unchanged; shadcn's SidebarTrigger already toggles via
            // onOpenChange — we're just reading the direction here.
            return prev
        })
    }, [clearIntentTimer])


    // ── FIX #2 continued: release manual-close lock once sidebar is re-opened ──
    // Only release when transitioning closed → open, and only in manual mode.
    // This is safe because onManualToggle sets manualModeRef *before* setOpen runs.

    React.useEffect(() => {
        if (open && manualModeRef.current) {
            // User has re-opened the sidebar (via trigger or external setOpen).
            // Release the lock so hover works normally again.
            manualModeRef.current = false
        }
    }, [open])


    // ── User menu open/close (FIX #1 applied here too) ────────────────────────

    const handleUserMenuOpenChange = React.useCallback(
        (menuOpen: boolean) => {
            // FIX #1: write into ref so any in-flight timer sees the latest value
            suspendHoverRef.current = menuOpen

            if (menuOpen) {
                clearIntentTimer()
                setOpenRef.current(true)
            }
            // When menuOpen = false we do NOT auto-close; let normal hover-leave
            // handle it so the sidebar doesn't snap shut mid-interaction.
        },
        [clearIntentTimer],
    )


    // ── Hover props (FIX #3, #4, #5) ──────────────────────────────────────────
    // Defined once at mount — object identity never changes.
    // FIX #5: guard pointerType so touch events on mobile don't trigger hover logic.

    const hoverProps = React.useMemo(() => ({
        onPointerEnter: (e: React.PointerEvent) => {
            if (e.pointerType !== "mouse") return   // FIX #5
            scheduleIntent("open")
        },
        onPointerLeave: (e: React.PointerEvent) => {
            if (e.pointerType !== "mouse") return   // FIX #5
            scheduleIntent("close")
        },
    }), [scheduleIntent]) // scheduleIntent is stable → hoverProps is stable (FIX #3)


    // ── Context value (FIX #3) ─────────────────────────────────────────────────
    // hoverProps is stable → contextValue is stable → AppSidebar never re-renders
    // due to context changes.

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
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                {sidebar}

                <SidebarInset>
                    <SiteHeader onManualToggle={onManualToggle} />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
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
