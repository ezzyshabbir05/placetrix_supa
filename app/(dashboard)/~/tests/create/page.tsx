// ─────────────────────────────────────────────────────────────────────────────
// app/(dashboard)/~/tests/create/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateTestClient } from "./CreateTestClient"
import {
  saveDraftAction,
  publishTestAction,
  generateQuestionsAction,
} from "./actions"


export default async function CreateTestPage() {
  const supabase = await createClient()

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // ── Account-type guard ─────────────────────────────────────────────────────
  // Only institute accounts may create tests.
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single()

  if (profile?.account_type !== "institute") {
    redirect("/~/dashboard")
  }

  // ── Fetch existing tags for the tag autocomplete ───────────────────────────
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name")
    .order("name")

  return (
    <CreateTestClient
      availableTags={tags ?? []}
      generateQuestionsAction={generateQuestionsAction}
      onSaveDraft={saveDraftAction}
      onPublish={publishTestAction}
    />
  )
}