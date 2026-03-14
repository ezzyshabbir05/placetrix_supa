"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PlusCircle, Sparkles, Upload, Trash2, Pencil, GripVertical
} from "lucide-react"
import { QuestionSheet } from "./QuestionSheet"
import { AiGenerateSheet } from "./AiGenerateSheet"
import { ImportSheet } from "./ImportSheet"
import type { LocalQuestion, QuestionForm, AiGenerateForm } from "../actions"

interface Props {
  questions: LocalQuestion[]
  setQuestions: React.Dispatch<React.SetStateAction<LocalQuestion[]>>
  availableTags: { id: string; name: string }[]
  generateQuestionsAction: (input: AiGenerateForm) => Promise<QuestionForm[]>
  disabled: boolean
}

export function QuestionsPanel({
  questions,
  setQuestions,
  availableTags,
  generateQuestionsAction,
  disabled,
}: Props) {
  const [questionSheetOpen, setQuestionSheetOpen] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<LocalQuestion | null>(null)

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  function openAdd() {
    setEditingQuestion(null)
    setQuestionSheetOpen(true)
  }

  function openEdit(q: LocalQuestion) {
    setEditingQuestion(q)
    setQuestionSheetOpen(true)
  }

  function handleQuestionSave(form: QuestionForm) {
    const asLocal: LocalQuestion = {
      id: editingQuestion?.id ?? crypto.randomUUID(),
      question_text: form.question_text,
      question_type: form.question_type,
      marks: parseFloat(form.marks) || 1,
      order_index: editingQuestion?.order_index ?? questions.length + 1,
      explanation: form.explanation,
      tag_names: form.tag_names,
      options: form.options,
    }

    setQuestions((prev) =>
      editingQuestion
        ? prev.map((q) => (q.id === editingQuestion.id ? asLocal : q))
        : [...prev, asLocal]
    )
    setQuestionSheetOpen(false)
  }

  function handleAiImport(forms: QuestionForm[]) {
    const newLocals: LocalQuestion[] = forms.map((form, i) => ({
      id: crypto.randomUUID(),
      question_text: form.question_text,
      question_type: form.question_type,
      marks: parseFloat(form.marks) || 1,
      order_index: questions.length + i + 1,
      explanation: form.explanation,
      tag_names: form.tag_names,
      options: form.options,
    }))
    setQuestions((prev) => [...prev, ...newLocals])
    setAiSheetOpen(false)
  }

  function handleDelete(id: string) {
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, order_index: i + 1 }))
    )
  }

  return (
    <>
      <Card className={disabled ? "pointer-events-none opacity-50" : undefined}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base">
                Questions
                {questions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {questions.length} · {totalMarks} marks
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {disabled
                  ? "Save settings first to unlock questions."
                  : "Add, edit, or reorder questions."}
              </CardDescription>
            </div>

            {!disabled && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAiSheetOpen(true)}>
                  <Sparkles className="mr-1.5 size-4" /> AI Generate
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportSheetOpen(true)}>
                  <Upload className="mr-1.5 size-4" /> Import
                </Button>
                <Button size="sm" onClick={openAdd}>
                  <PlusCircle className="mr-1.5 size-4" /> Add Question
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {questions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <PlusCircle className="size-9 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No questions yet</p>
                <p className="text-xs text-muted-foreground">
                  Add manually, generate with AI, or import a file.
                </p>
              </div>
            </div>
          ) : (
            <ol className="space-y-2">
              {questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                  <span className="mt-0.5 text-xs font-medium text-muted-foreground w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm">{q.question_text}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {q.question_type === "single_correct" ? "Single" : "Multiple"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </Badge>
                      {q.tag_names.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEdit(q)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(q.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <QuestionSheet
        open={questionSheetOpen}
        onOpenChange={setQuestionSheetOpen}
        defaultValues={
          editingQuestion
            ? {
                question_text: editingQuestion.question_text,
                question_type: editingQuestion.question_type,
                marks: String(editingQuestion.marks),
                explanation: editingQuestion.explanation,
                options: editingQuestion.options,
                tag_names: editingQuestion.tag_names,
              }
            : undefined
        }
        availableTags={availableTags}
        onSave={handleQuestionSave}
      />

      <AiGenerateSheet
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        generateQuestionsAction={generateQuestionsAction}
        onImport={handleAiImport}
      />

      <ImportSheet
        open={importSheetOpen}
        onOpenChange={setImportSheetOpen}
        onImport={handleAiImport}
      />
    </>
  )
}
