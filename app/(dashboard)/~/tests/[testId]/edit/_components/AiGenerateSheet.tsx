"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/ui/math-text"
import type {
  AiGenerateForm,
  GenerateQuestionsResult,
  QuestionForm,
} from "../actions"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  generateQuestionsAction?: (
    input: AiGenerateForm
  ) => Promise<GenerateQuestionsResult>
  onImport: (questions: QuestionForm[]) => void
}

type PreviewQuestion = QuestionForm & {
  _selected: boolean
  _previewId: string
  _warnings: string[]
  _showExplanation: boolean
}

const EMPTY: AiGenerateForm = {
  topic: "",
  count: "5",
  difficulty: "medium",
  question_type: "single_correct",
}

const DEFAULT_COUNT = "5"

export function AiGenerateSheet({
  open,
  onOpenChange,
  generateQuestionsAction,
  onImport,
}: Props) {
  const [form, setForm] = useState<AiGenerateForm>(EMPTY)
  const [generated, setGenerated] = useState<PreviewQuestion[]>([])
  const [generatedWith, setGeneratedWith] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const countFieldError =
    form.count !== "" && (Number(form.count) < 1 || Number(form.count) > 20)
      ? "Enter a number between 1 and 20."
      : null

  const setField = <K extends keyof AiGenerateForm>(k: K, v: AiGenerateForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleGenerate = () => {
    const count = Number(form.count)

    if (!form.topic.trim()) {
      setError("Please enter a topic.")
      return
    }

    if (!generateQuestionsAction) {
      setError("AI generation is not configured.")
      return
    }

    if (isNaN(count) || count < 1 || count > 20) {
      setError("Count must be between 1 and 20.")
      return
    }

    setError(null)
    setGenerated([])
    setGeneratedWith(null)

    startTransition(async () => {
      try {
        const result = await generateQuestionsAction(form)

        setGeneratedWith(result.generatedWith)
        setGenerated(
          result.questions.map((q) => ({
            ...q,
            _selected: true,
            _previewId: crypto.randomUUID(),
            _warnings: [],
            _showExplanation: false,
          }))
        )
      } catch (err: any) {
        setGeneratedWith(null)
        setError(err?.message ?? "Failed to generate questions. Please try again.")
      }
    })
  }

  const handleImport = () => {
    const selected = generated.filter((q) => q._selected)

    if (!selected.length) {
      setError("Select at least one question.")
      return
    }

    onImport(
      selected.map(({ _selected, _previewId, _warnings, _showExplanation, ...q }) => q)
    )

    handleClose()
  }

  const handleClose = () => {
    setForm(EMPTY)
    setGenerated([])
    setGeneratedWith(null)
    setError(null)
    onOpenChange(false)
  }

  const toggleSelected = (previewId: string) =>
    setGenerated((p) =>
      p.map((x) =>
        x._previewId === previewId ? { ...x, _selected: !x._selected } : x
      )
    )

  const toggleExplanation = (previewId: string) =>
    setGenerated((p) =>
      p.map((x) =>
        x._previewId === previewId ? { ...x, _showExplanation: !x._showExplanation } : x
      )
    )

  const selectedCount = generated.filter((q) => q._selected).length

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Generate with AI
          </SheetTitle>
          <SheetDescription>
            Describe a topic, generate questions, then review and add selected ones.
          </SheetDescription>

          {generatedWith && (
            <div className="pt-2">
              <Badge variant="secondary" className="font-normal">
                Generated with: {generatedWith}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              AI-generated questions may occasionally be inaccurate or misleading.
              Always review the content carefully before adding questions to your test.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              Topic / Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="e.g. Python list comprehensions, Newton's laws of motion…"
              value={form.topic}
              onChange={(e) => setField("topic", e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.count}
                onChange={(e) => setField("count", e.target.value)}
                onBlur={() => {
                  if (!form.count.trim()) setField("count", DEFAULT_COUNT)
                }}
                className={cn(
                  "text-sm",
                  countFieldError && "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isPending}
              />
              {countFieldError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {countFieldError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v: AiGenerateForm["difficulty"]) =>
                  setField("difficulty", v)
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.question_type}
                onValueChange={(v: AiGenerateForm["question_type"]) =>
                  setField("question_type", v)
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_correct">Single</SelectItem>
                  <SelectItem value="multiple_correct">Multiple</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={
              isPending ||
              !form.topic.trim() ||
              !generateQuestionsAction ||
              !!countFieldError
            }
            className="w-full"
          >
            {isPending ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>

          {isPending && (
            <div className="space-y-3">
              {Array.from({ length: Number(form.count) || 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-md border bg-muted/40" />
              ))}
            </div>
          )}

          {!isPending && generated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {generated.length} question{generated.length !== 1 ? "s" : ""} generated
                  </p>
                  {generatedWith && (
                    <p className="text-xs text-muted-foreground">
                      Generated with <span className="font-medium">{generatedWith}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() =>
                      setGenerated((p) => p.map((q) => ({ ...q, _selected: true })))
                    }
                  >
                    Select all
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() =>
                      setGenerated((p) => p.map((q) => ({ ...q, _selected: false })))
                    }
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {generated.map((q, idx) => (
                <div
                  key={q._previewId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelected(q._previewId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleSelected(q._previewId)
                    }
                  }}
                  className={cn(
                    "space-y-2 rounded-md border p-3 cursor-pointer transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    q._selected
                      ? "border-primary/40 bg-primary/5"
                      : "opacity-50 hover:opacity-80"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={q._selected}
                      onCheckedChange={() => toggleSelected(q._previewId)}
                      className="mt-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="flex-1 text-sm font-medium leading-snug">
                      {idx + 1}. <MathText>{q.question_text}</MathText>
                    </p>
                    {q._warnings.length > 0 && (
                      <Badge className="shrink-0 border-amber-300 bg-amber-100 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400">
                        Auto-fixed
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 pl-6">
                    {q.options.map((opt, oi) => (
                      <div
                        key={opt._key}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          opt.is_correct
                            ? "font-medium text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {opt.is_correct ? (
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 shrink-0" />
                        )}
                        {String.fromCharCode(65 + oi)}. <MathText>{opt.option_text}</MathText>
                      </div>
                    ))}
                  </div>

                  {q._warnings.length > 0 && (
                    <div className="space-y-1 pl-6">
                      {q._warnings.map((w, i) => (
                        <p
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
                        >
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pl-6">
                    <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                      {q.question_type === "single_correct" ? "Single" : "Multiple"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {q.marks} mark{q.marks !== 1 ? "s" : ""}
                    </span>
                    {q.tag_names.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-4 px-1.5 py-0 text-xs font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="pl-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExplanation(q._previewId)
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {q._showExplanation ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {q._showExplanation ? "Hide" : "Show"} explanation
                      </button>

                      {q._showExplanation && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          <MathText>{q.explanation}</MathText>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          {generated.length > 0 && (
            <Button onClick={handleImport} disabled={selectedCount === 0 || isPending}>
              Add {selectedCount} Question{selectedCount !== 1 ? "s" : ""}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
