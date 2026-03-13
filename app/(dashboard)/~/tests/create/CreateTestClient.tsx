"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/(dashboard)/~/tests/create/CreateTestClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Tag,
  X,
  Pencil,
  Save,
  Send,
  FileQuestion,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Clock,
  Sparkles,
  Upload,
  FileJson,
  ChevronDown,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionForm = {
  _key: string
  option_text: string
  is_correct: boolean
}

type QuestionForm = {
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: string
  explanation: string
  options: OptionForm[]
  tag_names: string[]
}

type LocalQuestion = {
  id: string
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: number
  order_index: number
  tag_names: string[]
  options: OptionForm[]
  explanation: string
}

type SettingsForm = {
  title: string
  description: string
  instructions: string
  time_limit_minutes: string
  available_from: string
  available_until: string
}

type AiGenerateForm = {
  topic: string
  count: string
  difficulty: "easy" | "medium" | "hard"
  question_type: "single_correct" | "multiple_correct" | "mixed"
}

type PreviewQuestion = QuestionForm & {
  _selected: boolean
  _previewId: string
  _errors: string[]
  _warnings: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeOptions = (): OptionForm[] =>
  Array.from({ length: 4 }, () => ({
    _key: crypto.randomUUID(),
    option_text: "",
    is_correct: false,
  }))

const defaultSettings: SettingsForm = {
  title: "", description: "", instructions: "",
  time_limit_minutes: "", available_from: "", available_until: "",
}

const defaultQuestion: QuestionForm = {
  question_text: "", question_type: "single_correct",
  marks: "1", explanation: "", options: makeOptions(), tag_names: [],
}

const localToForm = (q: LocalQuestion): QuestionForm => ({
  question_text: q.question_text,
  question_type: q.question_type,
  marks: String(q.marks),
  explanation: q.explanation,
  options: q.options,
  tag_names: q.tag_names,
})

const IMPORT_SAMPLE = JSON.stringify(
  [
    {
      question_text: "What is the output of print(type([]))?",
      question_type: "single_correct",
      marks: 1,
      explanation: "list is the type of an empty list literal.",
      tag_names: ["Python", "Data Types"],
      options: [
        { option_text: "<class 'list'>", is_correct: true },
        { option_text: "<class 'tuple'>", is_correct: false },
        { option_text: "<class 'dict'>", is_correct: false },
        { option_text: "<class 'array'>", is_correct: false },
      ],
    },
  ],
  null,
  2
)

// ─── Import validator ─────────────────────────────────────────────────────────

function validateImportItem(item: any, idx: number): PreviewQuestion {
  const errors: string[] = []
  const warnings: string[] = []

  if (!item?.question_text || typeof item.question_text !== "string" || !item.question_text.trim())
    errors.push("question_text is required and must be a non-empty string")

  const rawOptions = item?.options
  if (!Array.isArray(rawOptions)) {
    errors.push("options must be an array")
  } else if (rawOptions.length < 2) {
    errors.push(`options needs at least 2 items (found ${rawOptions.length})`)
  } else {
    const emptyCount = rawOptions.filter((o: any) => !String(o?.option_text ?? "").trim()).length
    if (emptyCount > 0)
      errors.push(`${emptyCount} option${emptyCount > 1 ? "s have" : " has"} empty option_text`)
    const correctCount = rawOptions.filter((o: any) => o?.is_correct === true).length
    if (correctCount === 0)
      errors.push("at least one option must have is_correct: true")
  }

  if (errors.length > 0) {
    return {
      question_text: String(item?.question_text || `Question ${idx + 1}`),
      question_type: "single_correct",
      marks: "1", explanation: "",
      options: [], tag_names: [],
      _selected: false, _previewId: crypto.randomUUID(),
      _errors: errors, _warnings: [],
    }
  }

  const rawType = item?.question_type
  const qType: "single_correct" | "multiple_correct" =
    rawType === "multiple_correct" ? "multiple_correct" : "single_correct"
  if (rawType !== undefined && rawType !== "single_correct" && rawType !== "multiple_correct")
    warnings.push(`unknown question_type "${rawType}" — defaulted to single_correct`)

  const rawMarks = parseFloat(item?.marks)
  const finalMarks = !isNaN(rawMarks) && rawMarks > 0 ? rawMarks : 1
  if (item?.marks !== undefined && (isNaN(rawMarks) || rawMarks <= 0))
    warnings.push(`invalid marks value "${item.marks}" — defaulted to 1`)

  let options: OptionForm[] = (rawOptions as any[]).map((o: any) => ({
    _key: crypto.randomUUID(),
    option_text: String(o.option_text ?? "").trim(),
    is_correct: Boolean(o.is_correct),
  }))

  if (qType === "single_correct") {
    const correctCount = options.filter((o) => o.is_correct).length
    if (correctCount > 1) {
      let kept = false
      options = options.map((o) => {
        if (!o.is_correct) return o
        if (!kept) { kept = true; return o }
        return { ...o, is_correct: false }
      })
      warnings.push(`${correctCount} correct options found — kept only the first`)
    }
  }

  return {
    question_text: String(item.question_text).trim(),
    question_type: qType,
    marks: String(finalMarks),
    explanation: String(item?.explanation ?? ""),
    tag_names: Array.isArray(item?.tag_names) ? item.tag_names.map(String) : [],
    options,
    _selected: true, _previewId: crypto.randomUUID(),
    _errors: [], _warnings: warnings,
  }
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  selected,
  available,
  onChange,
}: {
  selected: string[]
  available: { id: string; name: string }[]
  onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState("")

  const suggestions = input.trim()
    ? available
        .filter(
          (t) =>
            t.name.toLowerCase().includes(input.toLowerCase()) &&
            !selected.includes(t.name)
        )
        .slice(0, 6)
    : []

  const add = (name: string) => {
    const t = name.trim()
    if (t && !selected.includes(t)) onChange([...selected, t])
    setInput("")
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1 text-xs">
              <Tag className="h-3 w-3" />
              {t}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== t))}
                className="ml-0.5 rounded-full hover:bg-background/60"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          placeholder="Type a topic and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(input)
            }
          }}
          className="text-sm"
        />
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover py-1 shadow-md">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add(s.name)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
              >
                <Tag className="h-3 w-3 text-muted-foreground" />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Options Builder ──────────────────────────────────────────────────────────

function OptionsBuilder({
  options,
  questionType,
  onChange,
}: {
  options: OptionForm[]
  questionType: "single_correct" | "multiple_correct"
  onChange: (v: OptionForm[]) => void
}) {
  const updateText = (key: string, text: string) =>
    onChange(options.map((o) => (o._key === key ? { ...o, option_text: text } : o)))

  const toggleCorrect = (key: string) => {
    if (questionType === "single_correct") {
      onChange(options.map((o) => ({ ...o, is_correct: o._key === key })))
    } else {
      onChange(
        options.map((o) => (o._key === key ? { ...o, is_correct: !o.is_correct } : o))
      )
    }
  }

  const remove = (key: string) => {
    if (options.length <= 2) return
    onChange(options.filter((o) => o._key !== key))
  }

  return (
    <div className="space-y-2">
      {options.map((opt, idx) => (
        <div key={opt._key} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
            {String.fromCharCode(65 + idx)}
          </span>
          <Input
            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            value={opt.option_text}
            onChange={(e) => updateText(opt._key, e.target.value)}
            className={cn(
              "flex-1 text-sm",
              opt.is_correct && "border-emerald-500 focus-visible:ring-emerald-400"
            )}
          />
          <button
            type="button"
            title="Mark as correct"
            onClick={() => toggleCorrect(opt._key)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
              opt.is_correct
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"
            )}
          >
            {opt.is_correct ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Correct</span>
          </button>
          <button
            type="button"
            onClick={() => remove(opt._key)}
            disabled={options.length <= 2}
            className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-25"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {options.length < 6 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange([
              ...options,
              { _key: crypto.randomUUID(), option_text: "", is_correct: false },
            ])
          }
          className="h-8 text-xs text-muted-foreground"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Option
        </Button>
      )}
    </div>
  )
}

// ─── Preview List ─────────────────────────────────────────────────────────────

function PreviewList({
  items,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  items: PreviewQuestion[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}) {
  const errorCount = items.filter((q) => q._errors.length > 0).length
  const validCount = items.length - errorCount

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {items.length} question{items.length !== 1 ? "s" : ""} found
          </p>
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} invalid
            </Badge>
          )}
          {validCount > 0 && errorCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {validCount} importable
            </Badge>
          )}
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <button type="button" className="hover:text-foreground" onClick={onSelectAll}>
            Select all valid
          </button>
          <span>·</span>
          <button type="button" className="hover:text-foreground" onClick={onDeselectAll}>
            Deselect all
          </button>
        </div>
      </div>

      {items.map((q, idx) => {
        const hasErrors = q._errors.length > 0
        const hasWarnings = q._warnings.length > 0

        return (
          <div
            key={q._previewId}
            onClick={() => { if (!hasErrors) onToggle(q._previewId) }}
            className={cn(
              "space-y-2 rounded-md border p-3 transition-colors",
              hasErrors
                ? "cursor-not-allowed border-destructive/40 bg-destructive/5"
                : q._selected
                ? "cursor-pointer border-primary/40 bg-primary/5"
                : "cursor-pointer opacity-50 hover:opacity-80"
            )}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={q._selected}
                disabled={hasErrors}
                onCheckedChange={() => { if (!hasErrors) onToggle(q._previewId) }}
                className="mt-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <p
                className={cn(
                  "flex-1 text-sm font-medium leading-snug",
                  hasErrors && "text-muted-foreground"
                )}
              >
                {idx + 1}. {q.question_text || <span className="italic">(no question text)</span>}
              </p>
              {hasErrors && (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  Invalid
                </Badge>
              )}
              {!hasErrors && hasWarnings && (
                <Badge className="shrink-0 border-amber-300 bg-amber-100 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400">
                  Auto-fixed
                </Badge>
              )}
            </div>

            {hasErrors && (
              <div className="space-y-1 pl-6">
                {q._errors.map((e, i) => (
                  <p key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {e}
                  </p>
                ))}
              </div>
            )}

            {!hasErrors && hasWarnings && (
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

            {!hasErrors && (
              <>
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
                      {String.fromCharCode(65 + oi)}. {opt.option_text}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
                    {q.question_type === "single_correct" ? "Single" : "Multiple"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{q.marks} pt</span>
                  {q.tag_names.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {q.tag_names.join(", ")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Question Sheet ───────────────────────────────────────────────────────────

function QuestionSheet({
  open,
  onClose,
  onSave,
  availableTags,
  initialForm,
  mode = "add",
}: {
  open: boolean
  onClose: () => void
  onSave: (q: QuestionForm) => void
  availableTags: { id: string; name: string }[]
  initialForm?: QuestionForm
  mode?: "add" | "edit"
}) {
  const [form, setForm] = useState<QuestionForm>(
    initialForm ?? { ...defaultQuestion, options: makeOptions() }
  )
  const [errors, setErrors] = useState<string[]>([])

  const set = <K extends keyof QuestionForm>(k: K, v: QuestionForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const validate = (): string[] => {
    const e: string[] = []
    if (!form.question_text.trim()) e.push("Question text is required.")
    if (form.options.some((o) => !o.option_text.trim())) e.push("All options must have text.")
    if (!form.options.some((o) => o.is_correct)) e.push("Mark at least one correct answer.")
    if (form.question_type === "single_correct" && form.options.filter((o) => o.is_correct).length > 1)
      e.push("Single-answer type can only have one correct option.")
    const m = parseFloat(form.marks)
    if (isNaN(m) || m <= 0) e.push("Marks must be a positive number.")
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (e.length) { setErrors(e); return }
    onSave(form)
    setErrors([])
  }

  const handleClose = () => { setErrors([]); onClose() }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle>{mode === "edit" ? "Edit Question" : "Add Question"}</SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Make changes, then save."
              : "Enter the question, mark correct answer(s), then save."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {errors.length > 0 && (
            <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/10 p-3">
              {errors.map((e) => (
                <p key={e} className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {e}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              Question <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Enter the question text…"
              value={form.question_text}
              onChange={(e) => set("question_text", e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Answer Type</Label>
              <Select
                value={form.question_type}
                onValueChange={(v: "single_correct" | "multiple_correct") =>
                  setForm((f) => ({
                    ...f,
                    question_type: v,
                    options: f.options.map((o) => ({ ...o, is_correct: false })),
                  }))
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_correct">Single correct</SelectItem>
                  <SelectItem value="multiple_correct">Multiple correct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marks</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={form.marks}
                onChange={(e) => set("marks", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Options <span className="text-destructive">*</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {form.question_type === "single_correct" ? "Pick one correct" : "Pick all correct"}
              </span>
            </Label>
            <OptionsBuilder
              options={form.options}
              questionType={form.question_type}
              onChange={(v) => set("options", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Topic Tags</Label>
            <TagInput
              selected={form.tag_names}
              available={availableTags}
              onChange={(v) => set("tag_names", v)}
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="exp" className="rounded-md border px-1">
              <AccordionTrigger className="px-3 py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  Explanation
                  <span className="text-xs font-normal">(optional)</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <Textarea
                  placeholder="Explain why the correct answer is correct…"
                  value={form.explanation}
                  onChange={(e) => set("explanation", e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === "edit" ? "Save Changes" : "Save Question"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── AI Generate Sheet ────────────────────────────────────────────────────────

function AIGenerateSheet({
  open,
  onClose,
  onAdd,
  availableTags,
  generateAction,
}: {
  open: boolean
  onClose: () => void
  onAdd: (questions: QuestionForm[]) => void
  availableTags: { id: string; name: string }[]
  generateAction?: (input: AiGenerateForm) => Promise<QuestionForm[]>
}) {
  const [form, setForm] = useState<AiGenerateForm>({
    topic: "", count: "5", difficulty: "medium", question_type: "single_correct",
  })
  const [generated, setGenerated] = useState<PreviewQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const setField = <K extends keyof AiGenerateForm>(k: K, v: AiGenerateForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleGenerate = () => {
    if (!form.topic.trim()) { setError("Please enter a topic."); return }
    if (!generateAction) { setError("AI generation is not configured."); return }
    setError(null)
    startTransition(async () => {
      try {
        const questions = await generateAction(form)
        setGenerated(
          questions.map((q) => ({
            ...q,
            _selected: true,
            _previewId: crypto.randomUUID(),
            _errors: [],
            _warnings: [],
          }))
        )
      } catch (err: any) {
        setError(err?.message ?? "Failed to generate questions. Please try again.")
      }
    })
  }

  const handleAdd = () => {
    const selected = generated.filter((q) => q._selected)
    if (!selected.length) { setError("Select at least one question."); return }
    onAdd(selected.map(({ _selected, _previewId, _errors, _warnings, ...q }) => q))
    handleClose()
  }

  const handleClose = () => {
    setForm({ topic: "", count: "5", difficulty: "medium", question_type: "single_correct" })
    setGenerated([])
    setError(null)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Generate with AI
          </SheetTitle>
          <SheetDescription>
            Describe a topic, generate questions, then review and add selected ones.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                type="number" min="1" max="20"
                value={form.count}
                onChange={(e) => setField("count", e.target.value)}
                className="text-sm"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v: AiGenerateForm["difficulty"]) => setField("difficulty", v)}
                disabled={isPending}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
                onValueChange={(v: AiGenerateForm["question_type"]) => setField("question_type", v)}
                disabled={isPending}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
            disabled={isPending || !form.topic.trim()}
            className="w-full"
          >
            {isPending ? (
              <><Sparkles className="mr-2 h-4 w-4 animate-pulse" />Generating…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Generate Questions</>
            )}
          </Button>

          {generated.length > 0 && (
            <PreviewList
              items={generated}
              onToggle={(id) =>
                setGenerated((prev) =>
                  prev.map((q) =>
                    q._previewId === id ? { ...q, _selected: !q._selected } : q
                  )
                )
              }
              onSelectAll={() =>
                setGenerated((prev) =>
                  prev.map((q) => ({ ...q, _selected: q._errors.length === 0 }))
                )
              }
              onDeselectAll={() =>
                setGenerated((prev) => prev.map((q) => ({ ...q, _selected: false })))
              }
            />
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          {generated.length > 0 && (
            <Button
              onClick={handleAdd}
              disabled={!generated.some((q) => q._selected)}
            >
              Add {generated.filter((q) => q._selected).length} Question
              {generated.filter((q) => q._selected).length !== 1 ? "s" : ""}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Import Sheet ─────────────────────────────────────────────────────────────

function ImportSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (questions: QuestionForm[]) => void
}) {
  const [tab, setTab] = useState<"paste" | "file">("paste")
  const [jsonText, setJsonText] = useState("")
  const [parsed, setParsed] = useState<PreviewQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseJson = (text: string) => {
    setError(null)
    setParsed([])
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      setError("Invalid JSON syntax — check for missing brackets, quotes, or trailing commas.")
      return
    }
    if (!Array.isArray(data)) {
      setError("JSON must be an array [ ... ] of question objects at the top level.")
      return
    }
    if (data.length === 0) {
      setError("JSON array is empty — no questions to import.")
      return
    }
    const questions = data.map((item, i) => validateImportItem(item, i))
    setParsed(questions)
    const badCount = questions.filter((q) => q._errors.length > 0).length
    if (badCount === questions.length) {
      setError(
        `All ${questions.length} question${questions.length > 1 ? "s" : ""} failed validation.`
      )
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text)
      parseJson(text)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleAdd = () => {
    const selected = parsed.filter((q) => q._selected && q._errors.length === 0)
    if (!selected.length) { setError("Select at least one valid question."); return }
    onAdd(selected.map(({ _selected, _previewId, _errors, _warnings, ...q }) => q))
    handleClose()
  }

  const handleClose = () => {
    setTab("paste")
    setJsonText("")
    setParsed([])
    setError(null)
    onClose()
  }

  const selectableCount = parsed.filter((q) => q._selected && q._errors.length === 0).length

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-blue-500" />
            Import Questions
          </SheetTitle>
          <SheetDescription>
            Paste JSON or upload a <code className="rounded bg-muted px-1 text-xs">.json</code> file.
            Invalid questions are skipped.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex w-fit gap-1 rounded-md bg-muted p-1">
            {(["paste", "file"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setParsed([]); setError(null) }}
                className={cn(
                  "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "paste" ? "Paste JSON" : "Upload File"}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {tab === "paste" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JSON</Label>
                <button
                  type="button"
                  onClick={() => { setJsonText(IMPORT_SAMPLE); setParsed([]); setError(null) }}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                >
                  Load sample
                </button>
              </div>
              <Textarea
                placeholder={`[\n  {\n    "question_text": "...",\n    ...\n  }\n]`}
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setParsed([]); setError(null) }}
                rows={12}
                className="resize-none font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => parseJson(jsonText)}
                disabled={!jsonText.trim()}
              >
                Parse & Preview
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Upload .json file</Label>
              <div
                className="flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed p-10 transition-colors hover:bg-muted/40"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">JSON files only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {parsed.length > 0 && (
            <PreviewList
              items={parsed}
              onToggle={(id) =>
                setParsed((prev) =>
                  prev.map((q) =>
                    q._previewId === id && q._errors.length === 0
                      ? { ...q, _selected: !q._selected }
                      : q
                  )
                )
              }
              onSelectAll={() =>
                setParsed((prev) =>
                  prev.map((q) => ({ ...q, _selected: q._errors.length === 0 }))
                )
              }
              onDeselectAll={() =>
                setParsed((prev) => prev.map((q) => ({ ...q, _selected: false })))
              }
            />
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {parsed.length > 0 && (
            <Button onClick={handleAdd} disabled={selectableCount === 0}>
              Import {selectableCount} Question{selectableCount !== 1 ? "s" : ""}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Question Item ────────────────────────────────────────────────────────────

function QuestionItem({
  question,
  onEdit,
  onDelete,
}: {
  question: LocalQuestion
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 transition-colors hover:bg-muted/30">
      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
        {question.order_index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{question.question_text}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-4 px-1.5 py-0 text-xs">
            {question.question_type === "single_correct" ? "Single" : "Multiple"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {question.marks} pt{question.marks !== 1 ? "s" : ""}
          </span>
          {question.tag_names.length > 0 && (
            <span className="truncate text-xs text-muted-foreground">
              · {question.tag_names.slice(0, 2).join(", ")}
              {question.tag_names.length > 2 && ` +${question.tag_names.length - 2}`}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          title="Edit question"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="Delete question"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Add Questions Menu ───────────────────────────────────────────────────────

function AddQuestionsMenu({
  onManual,
  onAI,
  onImport,
  disabled,
}: {
  onManual: () => void
  onAI: () => void
  onImport: () => void
  disabled?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add Questions
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onManual}>
          <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
          Add Manually
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAI}>
          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
          Generate with AI
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport}>
          <FileJson className="mr-2 h-4 w-4 text-blue-500" />
          Import JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
//
// Key changes from original:
//   • Props.onSaveDraft and Props.onPublish now receive `testId` as the first
//     argument so the server action knows which DB row to upsert.
//   • handleSaveDraft auto-generates a UUID if settings haven't been confirmed
//     yet, so "Save Draft" always works without a prior "Save & Add Questions".
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  availableTags: { id: string; name: string }[]
  generateQuestionsAction?: (input: AiGenerateForm) => Promise<QuestionForm[]>
  onSaveDraft?: (testId: string, settings: SettingsForm, questions: LocalQuestion[]) => Promise<void>
  onPublish?: (testId: string, settings: SettingsForm, questions: LocalQuestion[]) => Promise<void>
}

export function CreateTestClient({
  availableTags,
  generateQuestionsAction,
  onSaveDraft,
  onPublish,
}: Props) {
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(defaultSettings)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [isSavingDraft, startSavingDraft] = useTransition()
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null)
  const [isPublishing, startPublish] = useTransition()

  const [questions, setQuestions] = useState<LocalQuestion[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const [manualOpen, setManualOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LocalQuestion | null>(null)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const appendQuestions = (forms: QuestionForm[]) => {
    setQuestions((prev) => [
      ...prev,
      ...forms.map((q, i): LocalQuestion => ({
        id: crypto.randomUUID(),
        question_text: q.question_text,
        question_type: q.question_type,
        marks: parseFloat(q.marks) || 1,
        order_index: prev.length + i + 1,
        tag_names: q.tag_names,
        options: q.options,
        explanation: q.explanation,
      })),
    ])
  }

  // Resolve or lazily create the local test UUID.
  // This UUID is used as the actual PK in the database (we insert with it).
  const resolveTestId = (): string => {
    if (testId) return testId
    const newId = crypto.randomUUID()
    setTestId(newId)
    return newId
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  const handleSaveSettings = () => {
    if (!settingsForm.title.trim()) { setSettingsError("Title is required."); return }
    setSettingsError(null)
    resolveTestId() // ensure testId is set, unlocking the questions panel
  }

  // ── Question sheet ─────────────────────────────────────────────────────────

  const handleQuestionSheetSave = (form: QuestionForm) => {
    if (editTarget) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editTarget.id
            ? {
                ...q,
                question_text: form.question_text,
                question_type: form.question_type,
                marks: parseFloat(form.marks) || 1,
                explanation: form.explanation,
                options: form.options,
                tag_names: form.tag_names,
              }
            : q
        )
      )
      setEditTarget(null)
    } else {
      appendQuestions([form])
      setManualOpen(false)
    }
  }

  const handleQuestionSheetClose = () => { setManualOpen(false); setEditTarget(null) }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== deleteTarget)
        .map((q, i) => ({ ...q, order_index: i + 1 }))
    )
    setDeleteTarget(null)
  }

  // ── Save Draft ─────────────────────────────────────────────────────────────
  // Works even if the user hasn't clicked "Save & Add Questions" yet.

  const handleSaveDraft = () => {
    if (!onSaveDraft) return
    if (!settingsForm.title.trim()) {
      setSettingsError("Title is required to save a draft.")
      return
    }
    setSettingsError(null)
    setSaveDraftError(null)
    const effectiveId = resolveTestId()
    startSavingDraft(async () => {
      try {
        await onSaveDraft(effectiveId, settingsForm, questions)
      } catch (err: any) {
        setSaveDraftError(err?.message ?? "Failed to save draft. Please try again.")
      }
    })
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  const handlePublish = () => {
    if (!testId || !onPublish) return
    setPublishError(null)
    startPublish(async () => {
      try {
        await onPublish(testId, settingsForm, questions)
      } catch (err: any) {
        setPublishError(err?.message ?? "Failed to publish. Please try again.")
      }
    })
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0)
  const canPublish = testId !== null && questions.length > 0
  const questionSheetOpen = manualOpen || editTarget !== null

  const setField =
    (key: keyof SettingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSettingsForm((f) => ({ ...f, [key]: e.target.value }))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto space-y-6 px-4 py-6 md:px-6 md:py-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Create Test</h1>
            <p className="text-sm text-muted-foreground">Draft your test and publish when ready.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <><span className="mr-2 h-4 w-4 animate-spin">⋯</span>Saving…</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save Draft</>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
            >
              {isPublishing ? (
                <><span className="mr-2 h-4 w-4 animate-spin">⋯</span>Publishing…</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Publish</>
              )}
            </Button>
          </div>
        </div>

        {saveDraftError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveDraftError}
          </div>
        )}

        {publishError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {publishError}
          </div>
        )}

        {/* Settings card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Test Settings</CardTitle>
            <CardDescription className="text-xs">
              Basic information and availability window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {settingsError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Mid-Semester Assessment – Computer Science"
                value={settingsForm.title}
                onChange={setField("title")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview shown on the test listing page…"
                value={settingsForm.description}
                onChange={setField("description")}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Shown to students before they begin the test…"
                value={settingsForm.instructions}
                onChange={setField("instructions")}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time_limit">
                Time Limit
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  (minutes — leave blank for untimed)
                </span>
              </Label>
              <div className="relative max-w-[160px]">
                <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="time_limit"
                  type="number"
                  min="1"
                  max="360"
                  placeholder="60"
                  value={settingsForm.time_limit_minutes}
                  onChange={setField("time_limit_minutes")}
                  className="pl-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="datetime-local"
                  value={settingsForm.available_from}
                  onChange={setField("available_from")}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="available_until">Available Until</Label>
                <Input
                  id="available_until"
                  type="datetime-local"
                  value={settingsForm.available_until}
                  onChange={setField("available_until")}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="pt-1">
              <Button onClick={handleSaveSettings} disabled={!settingsForm.title.trim()}>
                {testId ? (
                  <><Save className="mr-2 h-4 w-4" />Update Settings</>
                ) : (
                  <><ChevronRight className="mr-2 h-4 w-4" />Save & Add Questions</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions card */}
        <Card className={cn(!testId && "pointer-events-none select-none opacity-60")}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Questions</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {questions.length > 0
                    ? `${questions.length} question${questions.length !== 1 ? "s" : ""} · ${totalMarks} total marks`
                    : testId
                    ? "Add at least one question before publishing."
                    : "Save settings above to unlock."}
                </CardDescription>
              </div>
              {testId && (
                <AddQuestionsMenu
                  onManual={() => setManualOpen(true)}
                  onAI={() => setAiOpen(true)}
                  onImport={() => setImportOpen(true)}
                />
              )}
            </div>
          </CardHeader>

          <CardContent>
            {questions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FileQuestion className="h-9 w-9 text-muted-foreground opacity-25" />
                <div>
                  <p className="text-sm font-medium">No questions yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {testId
                      ? `Use "Add Questions" above to get started.`
                      : "Save test settings first."}
                  </p>
                </div>
                {testId && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Manual
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                      <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                      Generate with AI
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                      <FileJson className="mr-2 h-4 w-4 text-blue-500" />
                      Import JSON
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {questions.map((q) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    onEdit={() => setEditTarget(q)}
                    onDelete={() => setDeleteTarget(q.id)}
                  />
                ))}
                <Separator className="my-3" />
                <AddQuestionsMenu
                  onManual={() => setManualOpen(true)}
                  onAI={() => setAiOpen(true)}
                  onImport={() => setImportOpen(true)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publish CTA */}
        {canPublish && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Ready? Publish to make this test visible to students or save it as a draft.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/*
        key={editTarget?.id ?? "new"} forces a remount when switching between
        editing different questions, ensuring fresh form state.
      */}
      <QuestionSheet
        key={editTarget?.id ?? "new"}
        open={questionSheetOpen}
        onClose={handleQuestionSheetClose}
        onSave={handleQuestionSheetSave}
        availableTags={availableTags}
        initialForm={editTarget ? localToForm(editTarget) : undefined}
        mode={editTarget ? "edit" : "add"}
      />

      <AIGenerateSheet
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onAdd={appendQuestions}
        availableTags={availableTags}
        generateAction={generateQuestionsAction}
      />

      <ImportSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onAdd={appendQuestions}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the question and all its options. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirmed}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}