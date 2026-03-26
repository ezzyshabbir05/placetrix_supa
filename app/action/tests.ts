"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/actions/tests.ts
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ── Shared types (mirrored from CreateTestClient) ─────────────────────────────

type SettingsForm = {
  title: string
  description: string
  instructions: string
  time_limit_minutes: string
  available_from: string
  available_until: string
}

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

type AiGenerateForm = {
  topic: string
  count: string
  difficulty: "easy" | "medium" | "hard"
  question_type: "single_correct" | "multiple_correct" | "mixed"
}

// ── Helper: resolve tag names → tag UUIDs (upsert) ───────────────────────────

async function resolveTagIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagNames: string[],
  userId: string
): Promise<string[]> {
  if (!tagNames.length) return []

  const normalised = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))]

  // Use upsert with select to fetch IDs in one network call
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      normalised.map((name) => ({ name, created_by: userId })),
      { onConflict: "name" }
    )
    .select("id")
  if (error) throw new Error(error.message)

  return (data ?? []).map((t) => t.id)
}

// ── Create or update test settings ───────────────────────────────────────────

export async function saveTestSettingsAction(
  form: SettingsForm,
  testId?: string
): Promise<{ testId: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error("Unauthorized")

  const payload = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    instructions: form.instructions.trim() || null,
    time_limit_seconds: form.time_limit_minutes
      ? Math.round(parseFloat(form.time_limit_minutes) * 60)
      : null,
    available_from: form.available_from
      ? new Date(form.available_from).toISOString()
      : null,
    available_until: form.available_until
      ? new Date(form.available_until).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }

  if (testId) {
    const { error } = await supabase
      .from("tests")
      .update(payload)
      .eq("id", testId)
      .eq("institute_id", user.id)          // ✅ fixed: was created_by
    if (error) throw new Error(error.message)
    revalidatePath(`/~/tests/${testId}/edit`)
    return { testId }
  }

  const { data, error } = await supabase
    .from("tests")
    .insert({ ...payload, institute_id: user.id, status: "draft" })  // ✅ fixed: was created_by
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  return { testId: data.id }
}

// ── Add a question (with options + tags) ─────────────────────────────────────

export async function addQuestionAction(
  testId: string,
  form: QuestionForm
): Promise<LocalQuestion> {
  const supabase = await createClient();
  // ── 1. Parallelize prep (user check + order index) ───────────────────
  const [authRes, lastRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("questions")
      .select("order_index")
      .eq("test_id", testId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (authRes.error || !authRes.data.user) throw new Error("Unauthorized");
  const user = authRes.data.user;
  const orderIndex = (lastRes.data?.order_index ?? 0) + 1;

  // ── 2. Insert question (must happen before options/tags) ─────────────
  const { data: q, error: qErr } = await supabase
    .from("questions")
    .insert({
      test_id: testId,
      question_text: form.question_text.trim(),
      question_type: form.question_type,
      marks: parseFloat(form.marks),
      explanation: form.explanation.trim() || null,
      order_index: orderIndex,
    })
    .select("id, order_index")
    .single();
  if (qErr) throw new Error(qErr.message);

  // ── 3. Parallelize options + tags ───────────────────────────────────
  await Promise.all([
    supabase.from("options").insert(
      form.options.map((o, i) => ({
        question_id: q.id,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
        order_index: i,
      }))
    ),
    resolveTagIds(supabase, form.tag_names, user.id).then(async (tagIds) => {
      if (tagIds.length) {
        await supabase
          .from("question_tags")
          .insert(tagIds.map((tag_id) => ({ question_id: q.id, tag_id })));
      }
    }),
  ]);

  revalidatePath(`/~/tests/${testId}/edit`);

  return {
    id: q.id,
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    marks: parseFloat(form.marks),
    order_index: orderIndex,
    tag_names: form.tag_names,
    options: form.options,
    explanation: form.explanation,
  }
}

// ── Update an existing question ───────────────────────────────────────────────

export async function updateQuestionAction(
  questionId: string,
  form: QuestionForm,
  testId: string
): Promise<LocalQuestion> {
  const supabase = await createClient();
  const [authRes, qRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("questions")
      .update({
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        marks: parseFloat(form.marks),
        explanation: form.explanation.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .select("id, order_index")
      .single()
  ]);

  if (authRes.error || !authRes.data.user) throw new Error("Unauthorized");
  if (qRes.error) throw new Error(qRes.error.message);
  
  const user = authRes.data.user;
  const q = qRes.data;

  // Parallelize cleanup and rewrite of options/tags
  await Promise.all([
    supabase.from("options").delete().eq("question_id", questionId).then(() => 
      supabase.from("options").insert(
        form.options.map((o, i) => ({
          question_id: questionId,
          option_text: o.option_text.trim(),
          is_correct: o.is_correct,
          order_index: i,
        }))
      )
    ),
    supabase.from("question_tags").delete().eq("question_id", questionId).then(async () => {
      const tagIds = await resolveTagIds(supabase, form.tag_names, user.id);
      if (tagIds.length) {
        await supabase
          .from("question_tags")
          .insert(tagIds.map((tag_id) => ({ question_id: questionId, tag_id })));
      }
    })
  ]);

  revalidatePath(`/~/tests/${testId}/edit`);

  return {
    id: questionId,
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    marks: parseFloat(form.marks),
    order_index: q.order_index,
    tag_names: form.tag_names,
    options: form.options,
    explanation: form.explanation,
  }
}

// ── Delete a question ─────────────────────────────────────────────────────────

export async function deleteQuestionAction(
  questionId: string,
  testId: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
  if (error) throw new Error(error.message)

  revalidatePath(`/~/tests/${testId}/edit`)
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishTestAction(testId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("tests")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", testId)
    .eq("institute_id", user.id)             // ✅ fixed: was created_by
  if (error) throw new Error(error.message)

  revalidatePath("/~/tests")
  revalidatePath(`/~/tests/${testId}`)
}

// ── Save as draft ─────────────────────────────────────────────────────────────

export async function saveTestDraftAction(testId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("tests")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", testId)
    .eq("institute_id", user.id)             // ✅ fixed: was created_by
  if (error) throw new Error(error.message)

  revalidatePath(`/~/tests/${testId}/edit`)
}

// ── Fetch available tags (for TagInput suggestions) ───────────────────────────

export async function getAvailableTagsAction(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("tags").select("id, name").order("name")
  return data ?? []
}
