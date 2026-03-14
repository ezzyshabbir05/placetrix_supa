import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateTestClient } from "./_components/CreateTestClient"
import {
  saveDraftAction,
  publishTestAction,
  generateQuestionsAction,
  loadTestAction,
} from "./actions"

interface Props {
  params: Promise<{ testId: string }>
}

export default async function TestEditorPage({ params }: Props) {
  const { testId } = await params
  const supabase = await createClient()

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // ── Account-type guard ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (profile?.account_type !== "institute") redirect("/~/tests")

  // ── Tags ────────────────────────────────────────────────────────────────────
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name")
    .order("name")

  // ── Determine mode ──────────────────────────────────────────────────────────
  const isNew = testId === "new"
  const initialData = isNew ? null : await loadTestAction(testId, user.id)

  // Bounce if editing a test that doesn't exist or belongs to someone else
  if (!isNew && !initialData) redirect("/~/tests")

  return (
    <CreateTestClient
      testId={isNew ? undefined : testId}
      initialData={initialData ?? undefined}
      availableTags={tags ?? []}
      generateQuestionsAction={generateQuestionsAction}
      onSaveDraft={saveDraftAction}
      onPublish={publishTestAction}
    />
  )
}
