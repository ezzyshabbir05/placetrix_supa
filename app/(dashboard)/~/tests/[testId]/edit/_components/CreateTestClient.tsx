"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Send } from "lucide-react"
import { SettingsForm as SettingsFormComponent } from "./SettingsForm"
import { QuestionsPanel } from "./QuestionsPanel"
import type {
  SettingsForm,
  LocalQuestion,
  QuestionForm,
  AiGenerateForm,
  InitialTestData,
  GenerateQuestionsResult, // ← add this
} from "../actions"

interface Props {
  testId?: string
  initialData?: InitialTestData
  availableTags: { id: string; name: string }[]
  generateQuestionsAction: (input: AiGenerateForm) => Promise<GenerateQuestionsResult> // ← updated
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
}

export function CreateTestClient({
  testId: propTestId,
  initialData,
  availableTags,
  generateQuestionsAction,
  onSaveDraft,
  onPublish,
}: Props) {
  const isEditMode = propTestId !== undefined

  // Stable ID: use prop when editing, generate once when creating
  const [testId] = useState<string>(() => propTestId ?? crypto.randomUUID())

  const [settings, setSettings] = useState<SettingsForm>(
    initialData?.settings ?? EMPTY_SETTINGS
  )
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    initialData?.questions ?? []
  )

  // Settings panel is considered "saved" immediately when editing
  const [settingsSaved, setSettingsSaved] = useState(isEditMode)

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // ── Settings save ───────────────────────────────────────────────────────────
  const handleSettingsSave = useCallback(
    async (newSettings: SettingsForm) => {
      if (!newSettings.title.trim()) {
        toast.error("Title is required to save.")
        return
      }
      setIsSaving(true)
      try {
        await onSaveDraft(testId, newSettings, questions)
        setSettings(newSettings)
        setSettingsSaved(true)
        toast.success("Settings saved.")
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to save settings.")
      } finally {
        setIsSaving(false)
      }
    },
    [testId, questions, onSaveDraft]
  )

  // ── Draft save ──────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      await onSaveDraft(testId, settings, questions)
      toast.success("Draft saved.")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save draft.")
    } finally {
      setIsSaving(false)
    }
  }, [testId, settings, questions, onSaveDraft])

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    try {
      await onPublish(testId, settings, questions)
      // redirect happens server-side; component unmounts
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish.")
      setIsPublishing(false)
    }
  }, [testId, settings, questions, onPublish])

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
              disabled={isSaving || !settingsSaved}
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
              disabled={isPublishing || !settingsSaved}
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
          defaultValues={settings}
          isSaving={isSaving}
          onSave={handleSettingsSave}
        />

        {/* ── Questions ── */}
        <QuestionsPanel
          questions={questions}
          setQuestions={setQuestions}
          availableTags={availableTags}
          generateQuestionsAction={generateQuestionsAction}
          disabled={!settingsSaved}
        />

      </div>
    </div>
  )
}
