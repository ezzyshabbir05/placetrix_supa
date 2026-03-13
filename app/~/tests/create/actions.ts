"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/create/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { revalidatePath } from "next/cache"

// ── Input types ───────────────────────────────────────────────────────────────

export type TestSettingsInput = {
  title: string
  description: string
  instructions: string
  time_limit_minutes: number | null // UI stores minutes; DB stores seconds
  available_from: string | null     // ISO string or null
  available_until: string | null
}

export type OptionInput = {
  option_text: string
  is_correct: boolean
  order_index: number
}

export type QuestionInput = {
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: number
  explanation: string
  options: OptionInput[]
  tag_names: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertInstituteId(): Promise<string | null> {
  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "institute") return null
  return profile.id
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createTestAction(
  input: TestSettingsInput
): Promise<{ testId: string } | { error: string }> {
  const instituteId = await assertInstituteId()
  if (!instituteId) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tests")
    .insert({
      institute_id: instituteId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      instructions: input.instructions.trim() || null,
      time_limit_seconds: input.time_limit_minutes ? input.time_limit_minutes * 60 : null,
      available_from: input.available_from || null,
      available_until: input.available_until || null,
      status: "draft",
    })
    .select("id")
    .single()

  if (error || !data) return { error: error?.message ?? "Failed to create test" }
  return { testId: data.id }
}

export async function updateTestSettingsAction(
  testId: string,
  input: TestSettingsInput
): Promise<{ error?: string }> {
  const instituteId = await assertInstituteId()
  if (!instituteId) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("tests")
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      instructions: input.instructions.trim() || null,
      time_limit_seconds: input.time_limit_minutes ? input.time_limit_minutes * 60 : null,
      available_from: input.available_from || null,
      available_until: input.available_until || null,
    })
    .eq("id", testId)
    .eq("institute_id", instituteId)

  if (error) return { error: error.message }

  revalidatePath(`/tests/${testId}`)
  return {}
}

export async function addQuestionAction(
  testId: string,
  input: QuestionInput,
  orderIndex: number
): Promise<{ questionId: string } | { error: string }> {
  const instituteId = await assertInstituteId()
  if (!instituteId) return { error: "Unauthorized" }

  const supabase = await createClient()

  // Verify test ownership (RLS also covers this, but explicit is safer)
  const { data: test } = await supabase
    .from("tests")
    .select("id")
    .eq("id", testId)
    .eq("institute_id", instituteId)
    .single()

  if (!test) return { error: "Test not found or access denied" }

  // Insert question
  const { data: question, error: qError } = await supabase
    .from("questions")
    .insert({
      test_id: testId,
      question_text: input.question_text.trim(),
      question_type: input.question_type,
      marks: input.marks,
      explanation: input.explanation.trim() || null,
      order_index: orderIndex,
    })
    .select("id")
    .single()

  if (qError || !question) return { error: qError?.message ?? "Failed to create question" }

  // Insert options
  if (input.options.length > 0) {
    const { error: optError } = await supabase.from("options").insert(
      input.options.map((opt) => ({
        question_id: question.id,
        option_text: opt.option_text.trim(),
        is_correct: opt.is_correct,
        order_index: opt.order_index,
      }))
    )
    if (optError) return { error: optError.message }
  }

  // Resolve/create tags and link them
  for (const rawName of input.tag_names) {
    const name = rawName.trim()
    if (!name) continue

    // Upsert by name (unique constraint on tags.name)
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name }, { onConflict: "name" })
      .select("id")
      .single()

    if (!tagError && tag) {
      await supabase
        .from("question_tags")
        .insert({ question_id: question.id, tag_id: tag.id })
        .throwOnError()
    }
  }

  revalidatePath(`/tests/${testId}`)
  return { questionId: question.id }
}

export async function deleteQuestionAction(
  questionId: string,
  testId: string
): Promise<{ error?: string }> {
  const instituteId = await assertInstituteId()
  if (!instituteId) return { error: "Unauthorized" }

  const supabase = await createClient()

  // RLS ensures only the owning institute can delete
  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) return { error: error.message }

  revalidatePath(`/tests/${testId}`)
  return {}
}

export async function setTestStatusAction(
  testId: string,
  status: "draft" | "published"
): Promise<{ error?: string }> {
  const instituteId = await assertInstituteId()
  if (!instituteId) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("tests")
    .update({ status })
    .eq("id", testId)
    .eq("institute_id", instituteId)

  if (error) return { error: error.message }

  revalidatePath(`/tests/${testId}`)
  return {}
}

export async function getAvailableTagsAction(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tags")
    .select("id, name")
    .order("name")
    .limit(200)
  return data ?? []
}