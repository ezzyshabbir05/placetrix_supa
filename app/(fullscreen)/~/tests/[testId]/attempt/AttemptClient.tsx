"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/attempt/AttemptClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    CheckCircle2,
    Circle,
    CheckSquare,
    Square,
    Clock,
    ChevronLeft,
    ChevronRight,
    Send,
    Menu,
    Tag,
    BookOpen,
    AlertCircle,
    Loader2,
    AlertTriangle,
    Maximize,
    EyeOff,
    Flag,
    Shuffle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttemptTest, AttemptQuestion, AttemptInfo, SavedAnswer } from "./_types"


// ─── Constants ────────────────────────────────────────────────────────────────

// Number of focus-loss violations before the test is auto-submitted (strict mode only).
const MAX_VIOLATIONS = 6


// ─── Fullscreen Helpers ───────────────────────────────────────────────────────

function getFullscreenElement(): Element | null {
    return (
        document.fullscreenElement ??
        (document as any).webkitFullscreenElement ??
        (document as any).mozFullScreenElement ??
        null
    )
}

async function requestFullscreen(el: Element): Promise<void> {
    try {
        if (el.requestFullscreen) {
            await el.requestFullscreen()
        } else if ((el as any).webkitRequestFullscreen) {
            await (el as any).webkitRequestFullscreen()
        } else if ((el as any).mozRequestFullScreen) {
            await (el as any).mozRequestFullScreen()
        }
    } catch {
        // Fullscreen denied or not supported — silently continue
    }
}

async function exitFullscreen(): Promise<void> {
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen()
        }
    } catch {
        // Ignore
    }
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    if (seconds <= 0) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0)
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
}


// ─── Timer Display ────────────────────────────────────────────────────────────

function TimerDisplay({
    timeRemaining,
    timerDanger,
    timerWarning,
    compact = false,
}: {
    timeRemaining: number
    timerDanger: boolean
    timerWarning: boolean
    compact?: boolean
}) {
    if (compact) {
        return (
            <span
                className={cn(
                    "flex shrink-0 items-center gap-1.5 font-mono text-sm font-semibold tabular-nums",
                    timerDanger
                        ? "text-red-600 dark:text-red-400"
                        : timerWarning
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-foreground"
                )}
            >
                <Clock className={cn("h-3.5 w-3.5 shrink-0", timerDanger && "animate-pulse")} />
                {formatTime(timeRemaining)}
            </span>
        )
    }

    return (
        <div
            className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border py-3",
                "font-mono text-base font-bold tabular-nums transition-colors",
                timerDanger
                    ? "animate-pulse border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                    : timerWarning
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                        : "border-border bg-muted/30 text-foreground"
            )}
        >
            <Clock className="h-4 w-4 shrink-0" />
            {formatTime(timeRemaining)}
        </div>
    )
}


// ─── Question Navigator ───────────────────────────────────────────────────────

function QuestionNavigator({
    questions,
    currentIndex,
    answers,
    flagged,
    onJump,
}: {
    questions: AttemptQuestion[]
    currentIndex: number
    answers: Record<string, string[]>
    flagged: Record<string, boolean>
    onJump: (i: number) => void
}) {
    const answeredCount = questions.filter((q) => (answers[q.id] ?? []).length > 0).length

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Progress
                </p>
                <div className="flex min-w-0 items-center gap-2">
                    <Progress
                        value={(answeredCount / questions.length) * 100}
                        className="h-1.5 min-w-0 flex-1"
                    />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {answeredCount}/{questions.length}
                    </span>
                </div>
            </div>

            <div>
                <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Questions
                </p>
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, i) => {
                        const answered = (answers[q.id] ?? []).length > 0
                        const isFlagged = flagged[q.id] ?? false
                        const isCurrent = i === currentIndex
                        return (
                            <button
                                key={q.id}
                                onClick={() => onJump(i)}
                                className={cn(
                                    "relative aspect-square w-full rounded-full border text-xs font-semibold transition-all",
                                    isCurrent
                                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                                        : isFlagged
                                            ? answered
                                                ? "border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
                                                : "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                            : answered
                                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                                                : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                                )}
                            >
                                {i + 1}
                                {isFlagged && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-background bg-amber-500">
                                        <Flag className="h-1.5 w-1.5 fill-white text-white" />
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm border border-primary/40 bg-primary/10" />
                    Answered
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-sm border border-border bg-background" />
                    Not answered
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative h-3 w-3 shrink-0 rounded-sm border border-amber-400 bg-amber-100 dark:bg-amber-900/40">
                        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    </div>
                    Flagged for review
                </div>
            </div>
        </div>
    )
}


// ─── Option Button ────────────────────────────────────────────────────────────

function OptionButton({
    option,
    isSelected,
    questionType,
    isSaving,
    onClick,
}: {
    option: AttemptQuestion["options"][number]
    isSelected: boolean
    questionType: "single_correct" | "multiple_correct"
    isSaving: boolean
    onClick: () => void
}) {
    const isSingle = questionType === "single_correct"

    return (
        <button
            onClick={onClick}
            disabled={isSaving}
            className={cn(
                "flex w-full min-h-[3rem] items-center gap-3 rounded-xl border p-4 sm:p-5 text-left text-sm transition-all",
                "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                isSelected
                    ? "border-primary bg-primary/10 dark:bg-primary/15"
                    : "border-border bg-background",
                isSaving && "cursor-wait opacity-70"
            )}
        >
            <span className="shrink-0">
                {isSingle ? (
                    isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )
                ) : isSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                    <Square className="h-5 w-5 text-muted-foreground/50" />
                )}
            </span>
            <span className={cn("min-w-0 flex-1 break-words leading-snug", isSelected && "font-medium")}>
                {option.option_text}
            </span>
            {isSaving && isSelected && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
            )}
        </button>
    )
}


// ─── Question View ────────────────────────────────────────────────────────────

function QuestionView({
    question,
    index,
    total,
    selectedIds,
    savingId,
    saveError,
    isFlagged,
    onAnswer,
    onToggleFlag,
}: {
    question: AttemptQuestion
    index: number
    total: number
    selectedIds: string[]
    savingId: string | null
    saveError: string | null
    isFlagged: boolean
    onAnswer: (optionId: string) => void
    onToggleFlag: () => void
}) {
    const isSaving = savingId === question.id

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <Badge variant="outline" className="shrink-0 text-xs">
                        Q{index + 1} of {total}
                    </Badge>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                        {question.marks} {question.marks === 1 ? "mark" : "marks"}
                    </Badge>
                    <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                        {question.question_type === "single_correct"
                            ? "Single correct answer"
                            : "Select all correct answers"}
                    </Badge>

                    {/* ── Flag for review ───────────────────────────────────── */}
                    <button
                        onClick={onToggleFlag}
                        className={cn(
                            "ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1",
                            isFlagged
                                ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
                                : "border-border bg-background text-muted-foreground hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/20 dark:hover:text-amber-400"
                        )}
                        aria-label={isFlagged ? "Remove flag" : "Flag for review"}
                    >
                        <Flag
                            className={cn(
                                "h-3 w-3 shrink-0 transition-colors",
                                isFlagged ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                            )}
                        />
                        {isFlagged ? "Flagged" : "Flag"}
                    </button>
                </div>

                <p className="break-words text-base font-medium leading-relaxed">
                    {question.question_text}
                </p>

                {question.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        {question.tags.map((t) => (
                            <Badge key={t.id} variant="secondary" className="px-2 py-0 text-xs">
                                {t.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2.5">
                {question.options.map((opt) => (
                    <OptionButton
                        key={opt.id}
                        option={opt}
                        isSelected={selectedIds.includes(opt.id)}
                        questionType={question.question_type}
                        isSaving={isSaving}
                        onClick={() => onAnswer(opt.id)}
                    />
                ))}
            </div>

            {saveError ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {saveError} — please check your connection and try again.
                </p>
            ) : selectedIds.length > 0 ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isSaving ? (
                        <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
                    ) : (
                        <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Saved</>
                    )}
                </p>
            ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Not answered yet
                </p>
            )}
        </div>
    )
}


// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({
    test,
    questions,
    isResuming,
    isStarting,
    onBegin,
}: {
    test: AttemptTest
    questions: AttemptQuestion[]
    isResuming: boolean
    isStarting: boolean
    onBegin: () => void
}) {
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0)
    const hasTimer = !!test.time_limit_seconds

    return (
        <div className="flex min-h-screen bg-background px-6 py-6 md:px-7 md:py-7 lg:px-8 lg:py-8">
            <div className="space-y-7">

                <div className="space-y-3">
                    <h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">
                        {test.title}
                    </h1>
                    {test.description && (
                        <p className="break-words text-sm text-muted-foreground sm:text-base">
                            {test.description}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalMarks} mark
                            {totalMarks !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {hasTimer
                                ? `${Math.round(test.time_limit_seconds! / 60)} minutes`
                                : "Untimed"}
                        </span>
                    </div>
                    {test.available_until && (
                        <div className="inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span className="truncate">
                                Closes{" "}
                                {new Date(test.available_until).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {test.instructions && (
                    <div className="space-y-2 rounded-xl border bg-muted/40 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Instructions
                        </p>
                        <p className="overflow-hidden break-words whitespace-pre-line text-sm leading-relaxed">
                            {test.instructions}
                        </p>
                    </div>
                )}

                <div className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>Your answers are saved automatically after each selection.</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Maximize className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>
                            This test runs in <strong>fullscreen mode</strong>. Exiting fullscreen
                            will pause your interaction until you return.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {test.strict_mode ? (
                            <p>
                                <strong>Strict mode is enabled.</strong> Do not switch tabs, minimize the
                                browser, or open other applications. After{" "}
                                <strong>{MAX_VIOLATIONS} violations</strong>, your test will be
                                automatically submitted.
                            </p>
                        ) : (
                            <p>
                                <strong>Anti-cheat is active.</strong> Do not switch tabs, minimize the
                                browser, or open other applications. Violations are recorded and
                                visible to your instructor.
                            </p>
                        )}
                    </div>
                    {(test.shuffle_questions || test.shuffle_options) && (
                        <div className="flex items-start gap-2">
                            <Shuffle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <p>
                                {test.shuffle_questions && test.shuffle_options
                                    ? "Questions and answer options are displayed in a randomised order."
                                    : test.shuffle_questions
                                        ? "Questions are displayed in a randomised order."
                                        : "Answer options are displayed in a randomised order."}
                                {" "}Each candidate may see a different sequence.
                            </p>
                        </div>
                    )}
                    {hasTimer && (
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <p>The timer starts when you begin and cannot be paused.</p>
                        </div>
                    )}
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>Do not close this tab. You can resume from where you left off but timer will not pause.</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button size="lg" className="w-full sm:w-auto" onClick={onBegin} disabled={isStarting}>
                        {isStarting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting…</>
                        ) : isResuming ? (
                            "Resume test"
                        ) : (
                            "Begin test"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}


// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
    test: AttemptTest
    questions: AttemptQuestion[]
    attemptInfo: AttemptInfo | null
    savedAnswers: SavedAnswer[]
    onStartAttempt: () => Promise<AttemptInfo>
    onSaveAnswer?: (
        attemptId: string,
        questionId: string,
        selectedIds: string[],
        timeSpentSeconds?: number
    ) => Promise<void>
    onSubmit?: (attemptId: string, timeSpentSeconds: number) => Promise<void>
    serverNow: string
    // Called on every detected violation — fire-and-forget, never throws.
    onViolation?: (
        attemptId: string,
        type: "focus_loss" | "fullscreen_exit",
        totalCount: number,
        timestamp: string
    ) => Promise<void>
}

export function AttemptClient({
    test,
    questions,
    attemptInfo: initialAttemptInfo,
    savedAnswers,
    onStartAttempt,
    onSaveAnswer,
    onSubmit,
    onViolation,
    serverNow,
}: Props) {
    const isResuming = savedAnswers.length > 0 && initialAttemptInfo !== null

    // ── State ──────────────────────────────────────────────────────────────────

    const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(initialAttemptInfo)
    const [phase, setPhase] = useState<"intro" | "active">("intro")

    // ── Server Time Sync ───────────────────────────────────────────────────────
    const serverTimeOffset = useMemo(() => {
        return new Date(serverNow).getTime() - Date.now()
    }, [serverNow])

    const getNowOnServer = useCallback(() => {
        return new Date(Date.now() + serverTimeOffset)
    }, [serverTimeOffset])

    const storagePrefix = initialAttemptInfo ? `pt_attempt_${initialAttemptInfo.id}` : null

    const [currentIndex, setCurrentIndex] = useState(() => {
        if (typeof window !== "undefined" && storagePrefix) {
            const saved = localStorage.getItem(`${storagePrefix}_idx`)
            if (saved) return parseInt(saved, 10)
        }
        return 0
    })

    const [isStarting, setIsStarting] = useState(false)

    const [answers, setAnswers] = useState<Record<string, string[]>>(
        () => Object.fromEntries(savedAnswers.map((a) => [a.question_id, a.selected_option_ids]))
    )

    // flagged: tracks which question IDs are flagged for review (client-side only)
    const [flagged, setFlagged] = useState<Record<string, boolean>>(() => {
        if (typeof window !== "undefined" && storagePrefix) {
            const saved = localStorage.getItem(`${storagePrefix}_flags`)
            if (saved) return JSON.parse(saved)
        }
        return {}
    })

    const [savingId, setSavingId] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [navSheetOpen, setNavSheetOpen] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

    // Fullscreen
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)

    // Anti-cheat
    const [showFocusWarning, setShowFocusWarning] = useState(false)
    const [focusLostCount, setFocusLostCount] = useState(initialAttemptInfo?.tab_switch_count ?? 0)

    // ── Refs ───────────────────────────────────────────────────────────────────
    const autoSubmitted = useRef(false)
    const handleSubmitRef = useRef<((auto?: boolean) => Promise<void>) | undefined>(undefined)

    // Synchronous mutex: prevents dual-event firing (visibilitychange + blur)
    // from counting as two separate violations for the same user action.
    const focusGuardRef = useRef(false)

    // Ref mirrors — used inside the anti-cheat effect so it only registers once
    // (phase === "active") without isSubmitting or showFocusWarning in deps.
    const isSubmittingRef = useRef(false)
    const showFocusWarningRef = useRef(false)
    // Ref mirror for violation count so closures always see the latest value.
    const focusLostCountRef = useRef(initialAttemptInfo?.tab_switch_count ?? 0)

    const showSubmitDialogRef = useRef(false)
    const navSheetOpenRef = useRef(false)
    const showFullscreenWarningRef = useRef(false)
    const questionsLengthRef = useRef(questions.length)
    const currentIndexRef = useRef(currentIndex)
    const questionsRef = useRef(questions)

    // ── Persistence ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (attemptInfo && typeof window !== "undefined") {
            const prefix = `pt_attempt_${attemptInfo.id}`
            localStorage.setItem(`${prefix}_idx`, currentIndex.toString())
            localStorage.setItem(`${prefix}_flags`, JSON.stringify(flagged))
        }
    }, [attemptInfo, currentIndex, flagged])


    // ── Keep ref mirrors in sync ───────────────────────────────────────────────

    useEffect(() => { isSubmittingRef.current = isSubmitting }, [isSubmitting])
    useEffect(() => { showFocusWarningRef.current = showFocusWarning }, [showFocusWarning])
    useEffect(() => { showSubmitDialogRef.current = showSubmitDialog }, [showSubmitDialog])
    useEffect(() => { navSheetOpenRef.current = navSheetOpen }, [navSheetOpen])
    useEffect(() => { showFullscreenWarningRef.current = showFullscreenWarning }, [showFullscreenWarning])
    useEffect(() => { questionsLengthRef.current = questions.length }, [questions.length])
    useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
    useEffect(() => { questionsRef.current = questions }, [questions])


    // ── Fullscreen helpers ─────────────────────────────────────────────────────

    const enterFullscreen = useCallback(async () => {
        await requestFullscreen(document.documentElement)
    }, [])

    const leaveFullscreen = useCallback(async () => {
        if (getFullscreenElement()) await exitFullscreen()
    }, [])


    // ── Event Listeners: Fullscreen, Anti-Cheat & Copy-Block ──────────────────
    //
    // This effect registers ONCE when phase becomes "active" and never re-runs,
    // because isSubmitting and showFocusWarning are read from refs instead of
    // being in the dependency array. This closes the race window that existed
    // when the effect tore down and re-registered listeners on every state change.

    useEffect(() => {
        if (phase !== "active") return

        // 1. Fullscreen change ─────────────────────────────────────────────────
        const handleFullscreenChange = () => {
            const active = !!getFullscreenElement()
            if (!active && !autoSubmitted.current && !isSubmittingRef.current && attemptInfo) {
                setShowFullscreenWarning(true)
                // Persist fullscreen-exit violation (fire-and-forget)
                onViolation?.(
                    attemptInfo.id,
                    "fullscreen_exit",
                    focusLostCountRef.current,
                    getNowOnServer().toISOString()
                ).catch(() => { /* never throw */ })
            } else {
                setShowFullscreenWarning(false)
            }
        }

        // 2. Focus-loss trigger ────────────────────────────────────────────────
        //    Guarded by a ref so only one violation is counted no matter how
        //    many events fire for the same user action.
        const triggerFocusLoss = () => {
            if (autoSubmitted.current || isSubmittingRef.current) return
            if (focusGuardRef.current) return
            focusGuardRef.current = true

            focusLostCountRef.current += 1
            const currentCount = focusLostCountRef.current

            setFocusLostCount(currentCount)
            setShowFocusWarning(true)

            if (attemptInfo) {
                // Throttled violation recording: only sync to server every 2s
                // to prevent traffic storms from rapid browser focus events.
                const now = Date.now()
                const lastSync = (window as any)._lastViolationSync ?? 0
                if (now - lastSync > 2000) {
                    (window as any)._lastViolationSync = now
                    // Persist violation to the server immediately (fire-and-forget).
                    onViolation?.(
                        attemptInfo.id,
                        "focus_loss",
                        currentCount,
                        getNowOnServer().toISOString()
                    ).catch(() => { /* never throw */ })
                }
            }

            // Auto-submit once the threshold is crossed (strict mode only).
            if (test.strict_mode && currentCount >= MAX_VIOLATIONS && !autoSubmitted.current) {
                autoSubmitted.current = true
                // Defer so state updates above are flushed before submission starts.
                setTimeout(() => handleSubmitRef.current?.(true), 0)
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") triggerFocusLoss()
        }

        const handleBlur = () => {
            // Longer delay (200 ms) to:
            //   a) avoid false positives from shadcn dialogs that briefly steal focus, and
            //   b) ensure showFocusWarningRef is up-to-date before we check it.
            setTimeout(() => {
                // Suppress blur when the focus-warning dialog is already open —
                // clicking "I Understand" itself causes a transient blur.
                if (!document.hasFocus() && !showFocusWarningRef.current) {
                    triggerFocusLoss()
                }
            }, 200)
        }

        // 3. Copy / keyboard blocking / Navigation ──────────────────────────
        const handleKeyDown = (e: KeyboardEvent) => {
            // Guard: stop logic if the user is typing in an input/textarea.
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return
            }

            const ctrl = e.ctrlKey || e.metaKey
            // Block copy, save, view-source, print, select all
            if (ctrl && ["c", "p", "s", "u", "a"].includes(e.key.toLowerCase())) {
                e.preventDefault()
            }
            // Block DevTools shortcuts
            if (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
                e.preventDefault()
            }
            if (e.key === "F12") e.preventDefault()

            if (
                !showSubmitDialogRef.current &&
                !navSheetOpenRef.current &&
                !showFocusWarningRef.current &&
                !showFullscreenWarningRef.current &&
                !isSubmittingRef.current
            ) {
                // 'F' key: Toggle flag for review
                if (e.key.toLowerCase() === "f") {
                    const q = questionsRef.current[currentIndexRef.current]
                    if (q) {
                        toggleFlag(q.id)
                        e.preventDefault()
                    }
                }

                // Arrow keys for Next/Prev question
                if (e.key === "ArrowLeft") {
                    setCurrentIndex((i) => Math.max(0, i - 1))
                    e.preventDefault()
                } else if (e.key === "ArrowRight") {
                    setCurrentIndex((i) => Math.min(questionsLengthRef.current - 1, i + 1))
                    e.preventDefault()
                }
            }
        }

        const handleCopy = (e: ClipboardEvent) => e.preventDefault()
        const handleContextMenu = (e: MouseEvent) => e.preventDefault()
        const handleDragStart = (e: DragEvent) => e.preventDefault()

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (autoSubmitted.current || isSubmittingRef.current) return;
            e.preventDefault()
            e.returnValue = "" // Modern browsers require setting this property
        }

        // Register all listeners
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
        document.addEventListener("mozfullscreenchange", handleFullscreenChange)
        document.addEventListener("visibilitychange", handleVisibilityChange)
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("copy", handleCopy)
        document.addEventListener("contextmenu", handleContextMenu)
        document.addEventListener("dragstart", handleDragStart)
        window.addEventListener("blur", handleBlur)
        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("copy", handleCopy)
            document.removeEventListener("contextmenu", handleContextMenu)
            document.removeEventListener("dragstart", handleDragStart)
            window.removeEventListener("blur", handleBlur)
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
        // ─── Intentionally only [phase] in deps ───────────────────────────────
        // isSubmitting and showFocusWarning are read from their ref mirrors so
        // this effect registers exactly once when the test becomes active.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])


    // ── Toggle flag ────────────────────────────────────────────────────────────

    const toggleFlag = useCallback((questionId: string) => {
        setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
    }, [])


    // ── Save answer ────────────────────────────────────────────────────────────

    const saveAnswer = useCallback(
        async (questionId: string, selectedIds: string[], timeSpentSeconds: number = 0) => {
            if (!onSaveAnswer || !attemptInfo) return
            setSavingId(questionId)
            setSaveError(null)
            try {
                await onSaveAnswer(attemptInfo.id, questionId, selectedIds, timeSpentSeconds)
            } catch (err: any) {
                const msg = err?.message ?? "Failed to save answer"
                setSaveError(msg)
                toast.error(msg)
            } finally {
                setSavingId(null)
            }
        },
        [attemptInfo, onSaveAnswer]
    )


    // ── Handle option select ───────────────────────────────────────────────────

    // Ref to hold the debounce timer for answer saving
    const saveDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    const flushPendingSave = useCallback(async (questionId: string) => {
        if (saveDebounceRef.current[questionId]) {
            clearTimeout(saveDebounceRef.current[questionId])
            const pendingAnswers = answers[questionId] ?? []
            const promise = saveAnswer(questionId, pendingAnswers)
            delete saveDebounceRef.current[questionId]
            return promise
        }
    }, [answers, saveAnswer])

    const handleAnswer = useCallback(
        (
            questionId: string,
            optionId: string,
            questionType: "single_correct" | "multiple_correct"
        ) => {
            setAnswers((prev) => {
                const current = prev[questionId] ?? []
                const next =
                    questionType === "single_correct"
                        ? [optionId]
                        : current.includes(optionId)
                            ? current.filter((id) => id !== optionId)
                            : [...current, optionId]

                // Debounce saving: wait 1.5s after the last click for this question
                // before firing the network request.
                if (saveDebounceRef.current[questionId]) {
                    clearTimeout(saveDebounceRef.current[questionId])
                }

                saveDebounceRef.current[questionId] = setTimeout(() => {
                    saveAnswer(questionId, next)
                    delete saveDebounceRef.current[questionId]
                }, 1500)

                return { ...prev, [questionId]: next }
            })
        },
        [saveAnswer]
    )




    // ── Submit ─────────────────────────────────────────────────────────────────

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(
        async (auto = false) => {
            if (isSubmittingRef.current || !attemptInfo) return
            setIsSubmitting(true)
            setSubmitError(null)
            setShowSubmitDialog(false)
            setNavSheetOpen(false)
            setShowFullscreenWarning(false)
            setShowFocusWarning(false)

            const timeSpentSeconds = Math.floor(
                (getNowOnServer().getTime() - new Date(attemptInfo.started_at).getTime()) / 1000
            )

            try {
                await leaveFullscreen()              // ← exit fullscreen FIRST

                // Clear persistent local state for this attempt
                const prefix = `pt_attempt_${attemptInfo.id}`
                localStorage.removeItem(`${prefix}_idx`)
                localStorage.removeItem(`${prefix}_flags`)

                await onSubmit?.(attemptInfo.id, timeSpentSeconds)  // ← then redirect
            } catch (err: any) {
                setIsSubmitting(false)
                const msg = err?.message ?? "Submission failed. Please try again."
                setSubmitError(msg)
                toast.error(msg)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [attemptInfo, onSubmit, leaveFullscreen]
    )


    useEffect(() => {
        handleSubmitRef.current = handleSubmit
    })


    // ── Timer ──────────────────────────────────────────────────────────────────

    const timerStartRef = useRef<number>(0)
    const initialRemainingRef = useRef<number>(0)

    useEffect(() => {
        if (phase !== "active" || !test.time_limit_seconds || !attemptInfo || !attemptInfo.expires_at) return

        const serverNowMs = new Date(attemptInfo.server_time).getTime()
        const expiresAtMs = new Date(attemptInfo.expires_at).getTime()
        initialRemainingRef.current = Math.max(0, expiresAtMs - serverNowMs)
        timerStartRef.current = window.performance.now()

        const tick = () => {
            const elapsedMs = window.performance.now() - timerStartRef.current
            const remaining = Math.max(0, Math.floor((initialRemainingRef.current - elapsedMs) / 1000))
            setTimeRemaining(remaining)
            if (remaining === 0 && !autoSubmitted.current) {
                autoSubmitted.current = true
                handleSubmitRef.current?.(true)
            }
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [phase, test.time_limit_seconds, attemptInfo])


    // ── Derived ────────────────────────────────────────────────────────────────

    const currentQuestion = questions[currentIndex]
    const currentAnswers = answers[currentQuestion?.id ?? ""] ?? []
    const answeredCount = questions.filter((q) => (answers[q.id] ?? []).length > 0).length
    const unansweredCount = questions.length - answeredCount
    const flaggedCount = Object.values(flagged).filter(Boolean).length
    const progressPct = questions.length > 0
        ? Math.round((answeredCount / questions.length) * 100)
        : 0
    const timerDanger = timeRemaining !== null && timeRemaining <= 60
    const timerWarning = timeRemaining !== null && timeRemaining > 60 && timeRemaining <= 300
    const isLastQuestion = currentIndex === questions.length - 1


    // ── Tracking Offline and Question Pacing ───────────────────────────────────

    const [isOffline, setIsOffline] = useState(false)
    const timeTrackingRef = useRef<{ id: string; enteredAtServerTime: number }>({ id: "", enteredAtServerTime: 0 })

    useEffect(() => {
        setIsOffline(!navigator.onLine)
        const handleOffline = () => setIsOffline(true)
        const handleOnline = () => setIsOffline(false)
        window.addEventListener("offline", handleOffline)
        window.addEventListener("online", handleOnline)
        return () => {
            window.removeEventListener("offline", handleOffline)
            window.removeEventListener("online", handleOnline)
        }
    }, [])

    useEffect(() => {
        if (phase !== "active" || !currentQuestion || isSubmittingRef.current) return

        const nowServerTime = getNowOnServer().getTime()
        const track = timeTrackingRef.current

        // If we switched away from a previous question:
        // Combined synchronization:
        // 1. If there's a pending debounced content save, flush it now with the elapsed time.
        // 2. Otherwise, only report the elapsed time if it exceeds a 3-second "skimming" threshold.
        // This significantly reduces server traffic when users click through questions quickly.
        if (track.id && track.id !== currentQuestion.id && track.enteredAtServerTime > 0) {
            const elapsed = Math.max(0, Math.floor((nowServerTime - track.enteredAtServerTime) / 1000))

            if (saveDebounceRef.current[track.id]) {
                // Flush pending content + new time in ONE atomic request
                clearTimeout(saveDebounceRef.current[track.id])
                delete saveDebounceRef.current[track.id]
                const finalAnswers = answers[track.id] ?? []
                saveAnswer(track.id, finalAnswers, elapsed)
            } else if (elapsed >= 3 && attemptInfo) {
                // No pending content change, but significant time spent
                const currentSelections = answers[track.id] ?? []
                onSaveAnswer?.(attemptInfo.id, track.id, currentSelections, elapsed).catch(() => { })
            }
        }

        // Only explicitly reset tracker if we are indeed looking at a new/different question
        if (track.id !== currentQuestion.id) {
            timeTrackingRef.current = { id: currentQuestion.id, enteredAtServerTime: nowServerTime }
        }
    }, [currentIndex, currentQuestion, phase, attemptInfo, answers, onSaveAnswer, saveAnswer])

    // Override handleSubmit for final time pacing sync and flush
    const finalHandleSubmit = useCallback(async (auto = false) => {
        const finalTrack = timeTrackingRef.current
        if (finalTrack.enteredAtServerTime > 0 && finalTrack.id && attemptInfo) {
            const finalElapsed = Math.max(0, Math.floor((getNowOnServer().getTime() - finalTrack.enteredAtServerTime) / 1000))
            const finalAnswers = answers[finalTrack.id] ?? []

            // Consolidated final sync: content + time in ONE request before grading the test.
            // This prevents race conditions and redundant function invocations on completion.
            await saveAnswer(finalTrack.id, finalAnswers, finalElapsed)
        }
        await handleSubmit(auto)
    }, [handleSubmit, attemptInfo, answers, saveAnswer, getNowOnServer])


    useEffect(() => {
        handleSubmitRef.current = finalHandleSubmit
    }, [finalHandleSubmit])


    // ── Intro ──────────────────────────────────────────────────────────────────

    if (phase === "intro") {
        return (
            <IntroScreen
                test={test}
                questions={questions}
                isResuming={isResuming}
                isStarting={isStarting}
                onBegin={async () => {
                    let info = attemptInfo
                    if (!info) {
                        setIsStarting(true)
                        try {
                            info = await onStartAttempt()
                            setAttemptInfo(info)
                            setFocusLostCount(info.tab_switch_count)
                            focusLostCountRef.current = info.tab_switch_count
                        } catch (err: any) {
                            toast.error(err?.message || "Failed to start test")
                            setIsStarting(false)
                            return
                        }
                        setIsStarting(false)
                    }
                    await enterFullscreen()
                    setPhase("active")
                }}
            />
        )
    }


    // ── Active ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen overflow-hidden bg-background select-none">

            {/* ── Anti-Cheat: Focus Lost Dialog (highest priority) ─────────────── */}
            <AlertDialog open={showFocusWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            Warning: Focus Lost
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p className="text-sm text-foreground">
                                    You navigated away from the test window or switched tabs.
                                    This test is actively monitored for fair play.
                                </p>
                                <div className="flex items-start gap-2.5 rounded-xl border border-destructive bg-destructive/10 p-4">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                    <p className="text-sm text-destructive">
                                        Violation #{focusLostCount}{test.strict_mode ? <> of {MAX_VIOLATIONS}</> : null} recorded.{" "}
                                        {test.strict_mode
                                            ? focusLostCount >= MAX_VIOLATIONS
                                                ? "Your test is being submitted now."
                                                : `${MAX_VIOLATIONS - focusLostCount} remaining before automatic submission.`
                                            : "This incident has been logged and will be visible to your instructor."}
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => {
                                // Re-arm the guard so the next real violation is detected.
                                focusGuardRef.current = false
                                setShowFocusWarning(false)
                            }}
                        >
                            I Understand, Return to Test
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Fullscreen Required Dialog (shown only when focus dialog is closed) */}
            <AlertDialog open={showFullscreenWarning && !showFocusWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <Maximize className="h-5 w-5 shrink-0" />
                            Fullscreen Required
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p className="text-sm text-foreground">
                                    You exited fullscreen. This test must be completed in fullscreen mode.
                                </p>
                                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        Your progress is saved. No answers were lost.
                                        Please return to fullscreen to continue the test.
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={enterFullscreen}>
                            Return to Fullscreen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            {/* ── Question column ───────────────────────────────────────────────── */}
            <main className="flex min-w-0 flex-1 flex-col">

                {/* Submit error banner */}
                {submitError && (
                    <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3">
                        <div className="mx-auto flex items-center gap-2 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 break-words">{submitError}</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 shrink-0 px-2 text-destructive hover:bg-destructive/10"
                                onClick={() => finalHandleSubmit()}
                                disabled={isSubmitting}
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                {/* Offline banner */}
                {isOffline && (
                    <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3">
                        <div className="mx-auto flex flex-wrap items-center gap-2 text-sm font-semibold text-destructive">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>You are currently offline. Answers cannot be saved until you reconnect to the internet.</span>
                        </div>
                    </div>
                )}

                {/* Question body */}
                <div className="mx-auto w-full flex-1 px-6 py-6 pb-24 md:px-7 md:py-7 md:pb-14 lg:px-8 lg:py-8">

                    {/* Mobile-only: title + progress strip */}
                    <div className="mb-6 min-w-0 md:hidden">
                        <p className="mb-2 min-w-0 truncate text-sm font-semibold">{test.title}</p>
                        <div className="flex min-w-0 items-center gap-2">
                            <Progress value={progressPct} className="h-1.5 min-w-0 flex-1" />
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {answeredCount}/{questions.length}
                            </span>
                        </div>
                    </div>

                    {currentQuestion && (
                        <QuestionView
                            question={currentQuestion}
                            index={currentIndex}
                            total={questions.length}
                            selectedIds={currentAnswers}
                            savingId={savingId}
                            saveError={saveError}
                            isFlagged={flagged[currentQuestion.id] ?? false}
                            onAnswer={(optId) =>
                                handleAnswer(currentQuestion.id, optId, currentQuestion.question_type)
                            }
                            onToggleFlag={() => toggleFlag(currentQuestion.id)}
                        />
                    )}

                    {/* Desktop prev / next */}
                    <div className="mt-10 hidden items-center justify-between md:flex">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Button>

                        <span className="text-xs tabular-nums text-muted-foreground">
                            {currentIndex + 1} / {questions.length}
                        </span>

                        {isLastQuestion ? (
                            <Button
                                size="sm"
                                onClick={() => setShowSubmitDialog(true)}
                                disabled={isSubmitting}
                            >
                                <Send className="mr-1.5 h-4 w-4" />
                                Submit Test
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </main>


            {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
            <aside className="hidden md:flex md:w-56 lg:w-64 xl:w-72 shrink-0 border-l">
                <div className="sticky top-0 h-screen w-full overflow-y-auto">
                    <div className="flex flex-col gap-5 p-5 lg:p-6">

                        <div className="min-w-0 overflow-hidden border-b pb-4">
                            <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold leading-snug">
                                {test.title}
                            </p>
                        </div>

                        {test.time_limit_seconds && timeRemaining !== null && (
                            <TimerDisplay
                                timeRemaining={timeRemaining}
                                timerDanger={timerDanger}
                                timerWarning={timerWarning}
                            />
                        )}

                        <div className="px-1">
                            <QuestionNavigator
                                questions={questions}
                                currentIndex={currentIndex}
                                answers={answers}
                                flagged={flagged}
                                onJump={setCurrentIndex}
                            />
                        </div>

                        <Button
                            className="w-full shrink-0 mb-10"
                            onClick={() => setShowSubmitDialog(true)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" />Submitting…</>
                            ) : (
                                <><Send />Submit Test</>
                            )}
                        </Button>

                    </div>
                </div>
            </aside>


            {/* ── Mobile fixed bottom bar ───────────────────────────────────────── */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                <div className="flex h-16 items-center gap-2 px-5">

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        aria-label="Previous question"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                        {test.time_limit_seconds && timeRemaining !== null ? (
                            <TimerDisplay
                                timeRemaining={timeRemaining}
                                timerDanger={timerDanger}
                                timerWarning={timerWarning}
                                compact
                            />
                        ) : (
                            <span className="text-xs tabular-nums text-muted-foreground">
                                {currentIndex + 1} / {questions.length}
                            </span>
                        )}

                        {/* Mobile flag button — inline in bottom bar */}
                        {currentQuestion && (
                            <button
                                onClick={() => toggleFlag(currentQuestion.id)}
                                className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                    flagged[currentQuestion.id]
                                        ? "border-amber-400 bg-amber-100 text-amber-600 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                        : "border-border bg-background text-muted-foreground hover:border-amber-400 hover:text-amber-600"
                                )}
                                aria-label={flagged[currentQuestion.id] ? "Remove flag" : "Flag for review"}
                            >
                                <Flag
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        flagged[currentQuestion.id] && "fill-amber-500 text-amber-500"
                                    )}
                                />
                            </button>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setNavSheetOpen(true)}
                        aria-label="Open question navigator"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            size="sm"
                            className="shrink-0"
                            onClick={() => setShowSubmitDialog(true)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <><Send className="mr-1.5 h-3.5 w-3.5" />Submit</>
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                            aria-label="Next question"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>


            {/* ── Mobile nav sheet ──────────────────────────────────────────────── */}
            <Sheet open={navSheetOpen} onOpenChange={setNavSheetOpen}>
                <SheetContent side="right" className="flex w-72 flex-col overflow-hidden">
                    <SheetHeader className="border-b pb-4">
                        <SheetTitle className="text-sm">Question Navigator</SheetTitle>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                        <QuestionNavigator
                            questions={questions}
                            currentIndex={currentIndex}
                            answers={answers}
                            flagged={flagged}
                            onJump={(i) => {
                                setCurrentIndex(i)
                                setNavSheetOpen(false)
                            }}
                        />
                    </div>
                    <div className="border-t px-5 pb-4 pt-5">
                        <Button
                            className="w-full"
                            onClick={() => {
                                setNavSheetOpen(false)
                                setShowSubmitDialog(true)
                            }}
                            disabled={isSubmitting}
                        >
                            <Send />
                            Submit Test
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>


            {/* ── Submit dialog ─────────────────────────────────────────────────── */}
            <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit your test?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You have answered{" "}
                                    <span className="font-semibold text-foreground">{answeredCount}</span> of{" "}
                                    <span className="font-semibold text-foreground">{questions.length}</span> questions.
                                </p>
                                {unansweredCount > 0 && (
                                    <div className="flex items-start gap-2 rounded-xl border border-destructive bg-destructive/10 p-4">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                        <p className="text-sm text-destructive">
                                            {unansweredCount}{" "}
                                            {unansweredCount === 1 ? "question is" : "questions are"} unanswered.
                                            You cannot change answers after submitting.
                                        </p>
                                    </div>
                                )}
                                {flaggedCount > 0 && (
                                    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
                                        <Flag className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-600 dark:text-amber-400" />
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            {flaggedCount}{" "}
                                            {flaggedCount === 1 ? "question is" : "questions are"} flagged for review.
                                            Make sure you have revisited them before submitting.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Go back</AlertDialogCancel>
                        <AlertDialogAction onClick={() => finalHandleSubmit()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" />Submitting…</>
                            ) : (
                                "Submit Test"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
