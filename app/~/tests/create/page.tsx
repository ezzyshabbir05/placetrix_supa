// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/create/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { getAvailableTagsAction } from "./actions"
import { CreateTestClient } from "./CreateTestClient"

export default async function CreateTestPage() {
  const availableTags = await getAvailableTagsAction()
  return <CreateTestClient availableTags={availableTags} />
}