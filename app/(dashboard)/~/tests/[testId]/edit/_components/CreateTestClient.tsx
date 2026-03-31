"use client"

import { useState, useCallback, useEffect } from "react"
import { useBreadcrumbLabels } from "@/components/breadcrumb-context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Send } from "lucide-react"
import { SettingsForm as SettingsFormComponent, normalizeDefaults, toUTCISOString } from "./SettingsForm"
import { QuestionsPanel } from "./QuestionsPanel"
import type {
  SettingsForm,
  LocalQuestion,
  QuestionForm,
  AiGenerateForm,
  InitialTestData,
  GenerateQuestionsResult,
} from "../actions"

interface Props {
  testId?: string
  initialData?: InitialTestData
  availableTags: { id: string; name: string }[]
  generateQuestionsAction: (input: AiGenerateForm) => Promise<GenerateQuestionsResult>
  onSaveDraft: (id: string, settings: SettingsForm, questions: LocalQuestion[]) => Promise<void>
  onPublish: (id: string, settings: SettingsForm, questions: LocalQuestion[]) => Promise<void>
}

const EMPTY_SETTINGS: SettingsForm = {
  title: "",
  description: "",
  instructions: "",
  time_limit_minutes: "",
  available_from: "",
  available_until: "",
  shuffle_questions: true,
  shuffle_options: true,
  strict_mode: true,
}

/** Convert local datetime-local values to UTC ISO strings for DB storage */
function settingsForDb(settings: SettingsForm): SettingsForm {
  return {
    ...settings,
    available_from: toUTCISOString(settings.available_from),
    available_until: toUTCISOString(settings.available_until),
  }
}

export function CreateTestClient({
  testId: propTestId,
  initialData,
  availableTags,
  generateQuestionsAction,
  onSaveDraft,
  onPublish,
}: Props) {
  const { setLabel } = useBreadcrumbLabels()
  const isEditMode = propTestId !== undefined

  useEffect(() => {
    if (isEditMode && initialData?.settings?.title) {
      const title = initialData.settings.title || "Edit Test"
      setLabel(`/~/tests/${propTestId}`, title)
      setLabel(`/~/tests/${propTestId}/edit`, "Settings")
    } else if (!isEditMode) {
      setLabel(`/~/tests/new`, "New Test")
      setLabel(`/~/tests/new/edit`, "Draft")
    }
  }, [propTestId, initialData, isEditMode, setLabel])

  // Stable ID: use prop when editing, generate once when creating
  const [testId] = useState<string>(() => propTestId ?? crypto.randomUUID())

  // Settings state lives here so both SettingsForm and the header buttons
  // always see the latest values. Dates are kept in local "YYYY-MM-DDTHH:mm"
  // format for the inputs; they are converted to UTC just before saving.
  const [settings, setSettings] = useState<SettingsForm>(() =>
    normalizeDefaults(initialData?.settings ?? EMPTY_SETTINGS)
  )
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    initialData?.questions ?? []
  )

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Validation helpers
  const titleValid = settings.title.trim().length > 0
  const dateRangeValid =
    !settings.available_from ||
    !settings.available_until ||
    settings.available_from < settings.available_until

  const canSave = titleValid && dateRangeValid

  // ── Draft save ──────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!canSave) {
      if (!titleValid) toast.error("Title is required to save.")
      return
    }
    setIsSaving(true)
    try {
      await onSaveDraft(testId, settingsForDb(settings), questions)
      toast.success("Draft saved.")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save draft.")
    } finally {
      setIsSaving(false)
    }
  }, [testId, settings, questions, onSaveDraft, canSave, titleValid])

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!canSave) {
      if (!titleValid) toast.error("Title is required to publish.")
      return
    }
    setIsPublishing(true)
    try {
      await onPublish(testId, settingsForDb(settings), questions)
      // redirect happens server-side; component unmounts
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish.")
      setIsPublishing(false)
    }
  }, [testId, settings, questions, onPublish, canSave, titleValid])

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto space-y-6 px-4 py-6 md:px-6 md:py-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {isEditMode ? "Edit Test" : "Create Test"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Update settings and questions, then republish."
                : "Fill in settings, add questions, then publish."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving || !canSave}
              onClick={handleSaveDraft}
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save Draft
            </Button>

            <Button
              size="sm"
              disabled={isPublishing || !canSave}
              onClick={handlePublish}
            >
              {isPublishing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Publish
            </Button>
          </div>
        </div>

        {/* ── Settings ── */}
        <SettingsFormComponent
          values={settings}
          onChange={setSettings}
        />

        {/* ── Questions ── */}
        <QuestionsPanel
          questions={questions}
          setQuestions={setQuestions}
          availableTags={availableTags}
          generateQuestionsAction={generateQuestionsAction}
        />

      </div>
    </div>
  )
}
