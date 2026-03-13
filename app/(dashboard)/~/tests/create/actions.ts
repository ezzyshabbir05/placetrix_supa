"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/(dashboard)/~/tests/create/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ─── Shared local types ───────────────────────────────────────────────────────
// (Duplicated here so actions.ts has no client-side imports)

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

export type AiGenerateForm = {
  topic: string
  count: string
  difficulty: "easy" | "medium" | "hard"
  question_type: "single_correct" | "multiple_correct" | "mixed"
}

export type QuestionForm = {
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: string
  explanation: string
  options: OptionForm[]
  tag_names: string[]
}


// ─── Core helper: upsert test + questions + options + tags ────────────────────
//
// Uses "delete and re-insert" for questions/options/tags:
//   • Simplest correct strategy for a form that holds the full list in memory.
//   • Cascade on questions table auto-removes orphaned options & question_tags.
// ──────────────────────────────────────────────────────────────────────────────

async function saveTestToDb(
  testId: string,
  userId: string,
  settings: SettingsForm,
  questions: LocalQuestion[],
  status: "draft" | "published"
): Promise<void> {
  const supabase = await createClient()

  // 1. Upsert test row (conflict on primary key)
  const { error: testError } = await supabase.from("tests").upsert(
    {
      id: testId,
      institute_id: userId,
      title: settings.title.trim(),
      description: settings.description.trim() || null,
      instructions: settings.instructions.trim() || null,
      time_limit_seconds: settings.time_limit_minutes
        ? Math.round(parseFloat(settings.time_limit_minutes) * 60)
        : null,
      available_from: settings.available_from || null,
      available_until: settings.available_until || null,
      status,
    },
    { onConflict: "id" }
  )
  if (testError) throw new Error("Failed to save test: " + testError.message)

  if (questions.length === 0) return

  // 2. Remove existing questions — cascade removes options & question_tags
  const { error: delError } = await supabase
    .from("questions")
    .delete()
    .eq("test_id", testId)
  if (delError) throw new Error("Failed to clear old questions: " + delError.message)

  // 3. Insert questions (order_index = position in the client array, 1-based)
  const { data: insertedQuestions, error: qError } = await supabase
    .from("questions")
    .insert(
      questions.map((q, i) => ({
        test_id: testId,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        order_index: i + 1,
        explanation: q.explanation?.trim() || null,
      }))
    )
    .select("id, order_index")

  if (qError || !insertedQuestions) {
    throw new Error("Failed to insert questions: " + (qError?.message ?? "unknown"))
  }

  // 4. Build a flat options array across all questions and batch-insert
  const optionsPayload: {
    question_id: string
    option_text: string
    is_correct: boolean
    order_index: number
  }[] = []

  for (const dbQ of insertedQuestions) {
    const localQ = questions[dbQ.order_index - 1]
    if (!localQ) continue
    localQ.options.forEach((opt, oi) => {
      optionsPayload.push({
        question_id: dbQ.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        order_index: oi + 1,
      })
    })
  }

  if (optionsPayload.length > 0) {
    const { error: optError } = await supabase.from("options").insert(optionsPayload)
    if (optError) throw new Error("Failed to insert options: " + optError.message)
  }

  // 5. Tags — upsert by name, then link via question_tags
  const allTagNames = [
    ...new Set(questions.flatMap((q) => q.tag_names.map((t) => t.trim()).filter(Boolean))),
  ]

  if (allTagNames.length > 0) {
    // Upsert tag names (ignore duplicates)
    await supabase
      .from("tags")
      .upsert(allTagNames.map((name) => ({ name })), { onConflict: "name" })

    // Fetch IDs for all referenced tags
    const { data: tagRecords } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", allTagNames)

    const tagMap: Record<string, string> = Object.fromEntries(
      (tagRecords ?? []).map((t) => [t.name, t.id])
    )

    // Build question_tags rows
    const questionTagsPayload: { question_id: string; tag_id: string }[] = []

    for (const dbQ of insertedQuestions) {
      const localQ = questions[dbQ.order_index - 1]
      if (!localQ) continue
      for (const tagName of localQ.tag_names) {
        const tagId = tagMap[tagName.trim()]
        if (tagId) questionTagsPayload.push({ question_id: dbQ.id, tag_id: tagId })
      }
    }

    if (questionTagsPayload.length > 0) {
      const { error: qtError } = await supabase
        .from("question_tags")
        .insert(questionTagsPayload)
      if (qtError) throw new Error("Failed to link tags: " + qtError.message)
    }
  }
}


// ─── Save Draft ───────────────────────────────────────────────────────────────

export async function saveDraftAction(
  testId: string,
  settings: SettingsForm,
  questions: LocalQuestion[]
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await saveTestToDb(testId, user.id, settings, questions, "draft")
  revalidatePath("/~/tests")
}


// ─── Publish Test ─────────────────────────────────────────────────────────────

export async function publishTestAction(
  testId: string,
  settings: SettingsForm,
  questions: LocalQuestion[]
): Promise<void> {
  if (!settings.title.trim()) throw new Error("Title is required.")
  if (questions.length === 0)
    throw new Error("Add at least one question before publishing.")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await saveTestToDb(testId, user.id, settings, questions, "published")
  revalidatePath("/~/tests")
  redirect(`/~/tests/${testId}`)
}


// ─── AI Question Generation ───────────────────────────────────────────────────
//
// Calls the Anthropic Messages API and coerces the response into the same
// QuestionForm shape that QuestionSheet / ImportSheet produce, so they can be
// previewed and edited before being added to the test.
// ──────────────────────────────────────────────────────────────────────────────

export async function generateQuestionsAction(
  input: AiGenerateForm
): Promise<QuestionForm[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("AI generation is not configured on this server.")

  const count = Math.min(20, Math.max(1, parseInt(input.count, 10) || 5))

  const typeInstruction =
    input.question_type === "mixed"
      ? 'Mix "single_correct" and "multiple_correct" types across the questions.'
      : `Set "question_type" to "${input.question_type}" for every question.`

  const marksHint =
    input.difficulty === "easy" ? 1 : input.difficulty === "medium" ? 1 : 2

  const prompt = `Generate exactly ${count} ${input.difficulty}-difficulty multiple-choice questions on the topic: "${input.topic}".
${typeInstruction}

Return ONLY a valid JSON array. No markdown, no code fences, no explanation — just raw JSON.

Required schema for each element:
{
  "question_text": "string (clear, complete question)",
  "question_type": "single_correct" | "multiple_correct",
  "marks": ${marksHint},
  "explanation": "string (why the answer is correct)",
  "tag_names": ["topic tag"],
  "options": [
    { "option_text": "string", "is_correct": true | false },
    ...exactly 4 options total...
  ]
}

Constraints:
- single_correct → exactly 1 option has is_correct: true
- multiple_correct → 2 or more options have is_correct: true
- All distractors must be plausible, not obviously wrong
- question_text must be self-contained (no references to external figures)`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system:
        "You are an expert educator creating assessment questions. " +
        "Return only valid JSON arrays with no surrounding text or markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API responded with ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const rawText: string = data.content?.[0]?.text ?? ""

  // Strip accidental markdown fences the model sometimes adds
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  let parsed: any[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("AI returned malformed JSON. Please try again.")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI returned an unexpected format. Please try again.")
  }

  // Normalise each item into QuestionForm
  return parsed.map((q: any): QuestionForm => {
    const qType: "single_correct" | "multiple_correct" =
      q.question_type === "multiple_correct" ? "multiple_correct" : "single_correct"

    let options: OptionForm[] = Array.isArray(q.options)
      ? q.options.map((o: any) => ({
          _key: crypto.randomUUID(),
          option_text: String(o?.option_text ?? "").trim(),
          is_correct: Boolean(o?.is_correct),
        }))
      : []

    // Guard: single_correct must have exactly one correct
    if (qType === "single_correct") {
      const correct = options.filter((o) => o.is_correct)
      if (correct.length !== 1) {
        let fixed = false
        options = options.map((o) => {
          if (!o.is_correct) return o
          if (!fixed) { fixed = true; return o }
          return { ...o, is_correct: false }
        })
        if (!fixed && options.length > 0) {
          options[0] = { ...options[0], is_correct: true }
        }
      }
    }

    return {
      question_text: String(q.question_text ?? "").trim(),
      question_type: qType,
      marks: String(q.marks ?? marksHint),
      explanation: String(q.explanation ?? "").trim(),
      tag_names: Array.isArray(q.tag_names)
        ? q.tag_names.map((t: any) => String(t).trim()).filter(Boolean)
        : [],
      options,
    }
  })
}