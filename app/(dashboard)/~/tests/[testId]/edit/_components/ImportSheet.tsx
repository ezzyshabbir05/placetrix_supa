"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertCircle, AlertTriangle, CheckCircle2, Circle, FileJson, Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/ui/math-text"
import type { QuestionForm, OptionForm } from "../actions"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (questions: QuestionForm[]) => void
}

type PreviewQuestion = QuestionForm & {
  _selected: boolean
  _previewId: string
  _errors: string[]
  _warnings: string[]
}

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

function validateItem(item: any, idx: number): PreviewQuestion {
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
    if (correctCount === 0) errors.push("at least one option must have is_correct: true")
  }

  if (errors.length > 0) {
    return {
      question_text: String(item?.question_text || `Question ${idx + 1}`),
      question_type: "single_correct",
      marks: 1, explanation: "", options: [], tag_names: [],
      _selected: false, _previewId: crypto.randomUUID(), _errors: errors, _warnings: [],
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
    marks: finalMarks,
    explanation: String(item?.explanation ?? ""),
    tag_names: Array.isArray(item?.tag_names) ? item.tag_names.map(String) : [],
    options,
    _selected: true, _previewId: crypto.randomUUID(), _errors: [], _warnings: warnings,
  }
}

export function ImportSheet({ open, onOpenChange, onImport }: Props) {
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
    const questions = data.map((item, i) => validateItem(item, i))
    setParsed(questions)
    const badCount = questions.filter((q) => q._errors.length > 0).length
    if (badCount === questions.length) {
      setError(`All ${questions.length} question${questions.length > 1 ? "s" : ""} failed validation.`)
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

  const handleImport = () => {
    const selected = parsed.filter((q) => q._selected && q._errors.length === 0)
    if (!selected.length) { setError("Select at least one valid question."); return }
    onImport(selected.map(({ _selected, _previewId, _errors, _warnings, ...q }) => q))
    handleClose()
  }

  const handleClose = () => {
    setTab("paste")
    setJsonText("")
    setParsed([])
    setError(null)
    onOpenChange(false)
  }

  const toggle = (id: string) =>
    setParsed((p) =>
      p.map((q) =>
        q._previewId === id && q._errors.length === 0 ? { ...q, _selected: !q._selected } : q
      )
    )

  const errorCount = parsed.filter((q) => q._errors.length > 0).length
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
            Paste JSON or upload a{" "}
            <code className="rounded bg-muted px-1 text-xs">.json</code> file.
            Invalid questions are skipped.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

          {/* Tabs */}
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
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
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
                Parse &amp; Preview
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
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {parsed.length} question{parsed.length !== 1 ? "s" : ""} found
                  </p>
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs">{errorCount} invalid</Badge>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setParsed((p) => p.map((q) => ({ ...q, _selected: q._errors.length === 0 })))}
                  >
                    Select all valid
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setParsed((p) => p.map((q) => ({ ...q, _selected: false })))}
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {parsed.map((q, idx) => {
                const hasErrors = q._errors.length > 0
                const hasWarnings = q._warnings.length > 0

                return (
                  <div
                    key={q._previewId}
                    onClick={() => { if (!hasErrors) toggle(q._previewId) }}
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
                        onCheckedChange={() => { if (!hasErrors) toggle(q._previewId) }}
                        className="mt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className={cn("flex-1 text-sm font-medium leading-snug", hasErrors && "text-muted-foreground")}>
                        {idx + 1}. {q.question_text ? <MathText>{q.question_text}</MathText> : <span className="italic">(no question text)</span>}
                      </p>
                      {hasErrors && <Badge variant="destructive" className="shrink-0 text-xs">Invalid</Badge>}
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
                            <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                          </p>
                        ))}
                      </div>
                    )}

                    {!hasErrors && hasWarnings && (
                      <div className="space-y-1 pl-6">
                        {q._warnings.map((w, i) => (
                          <p key={i} className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
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
                              {String.fromCharCode(65 + oi)}. <MathText>{opt.option_text}</MathText>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pl-6">
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
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {parsed.length > 0 && (
            <Button onClick={handleImport} disabled={selectableCount === 0}>
              Import {selectableCount} Question{selectableCount !== 1 ? "s" : ""}
            </Button>
          )}
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
