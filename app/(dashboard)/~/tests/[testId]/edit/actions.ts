// "use server"

// import { redirect } from "next/navigation"
// import { revalidatePath } from "next/cache"
// import { createClient } from "@/lib/supabase/server"
// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

// // --- Shared types ---
// export type SettingsForm = {
//   title: string
//   description: string
//   instructions: string
//   time_limit_minutes: string
//   available_from: string
//   available_until: string
// }

// export type OptionForm = {
//   _key: string
//   option_text: string
//   is_correct: boolean
// }

// export type LocalQuestion = {
//   id: string
//   question_text: string
//   question_type: "single_correct" | "multiple_correct"
//   marks: number
//   order_index: number
//   tag_names: string[]
//   options: OptionForm[]
//   explanation: string
// }

// export type QuestionForm = {
//   question_text: string
//   question_type: "single_correct" | "multiple_correct"
//   marks: string
//   explanation: string
//   options: OptionForm[]
//   tag_names: string[]
// }

// export type AiGenerateForm = {
//   topic: string
//   count: string
//   difficulty: "easy" | "medium" | "hard"
//   question_type: "single_correct" | "multiple_correct" | "mixed"
// }

// export type InitialTestData = {
//   settings: SettingsForm
//   questions: LocalQuestion[]
//   status: "draft" | "published"
// }

// // --- Database Helpers ---
// async function saveTestToDb(
//   testId: string,
//   userId: string,
//   settings: SettingsForm,
//   questions: LocalQuestion[],
//   status: "draft" | "published"
// ): Promise<void> {
//   const supabase = await createClient()

//   const { data: existing } = await supabase
//     .from("tests")
//     .select("institute_id")
//     .eq("id", testId)
//     .maybeSingle()

//   if (existing && existing.institute_id !== userId) {
//     throw new Error("Access denied.")
//   }

//   const { error: testError } = await supabase.from("tests").upsert(
//     {
//       id: testId,
//       institute_id: userId,
//       title: settings.title.trim(),
//       description: settings.description.trim() || null,
//       instructions: settings.instructions.trim() || null,
//       time_limit_seconds: settings.time_limit_minutes
//         ? Math.round(parseFloat(settings.time_limit_minutes) * 60)
//         : null,
//       available_from: settings.available_from || null,
//       available_until: settings.available_until || null,
//       status,
//     },
//     { onConflict: "id" }
//   )
//   if (testError) throw new Error("Failed to save test: " + testError.message)

//   const { data: existingRows } = await supabase
//     .from("questions")
//     .select("id")
//     .eq("test_id", testId)

//   const existingIds = new Set((existingRows ?? []).map((r) => r.id as string))
//   const incomingIds = new Set(questions.map((q) => q.id))

//   const removedIds = [...existingIds].filter((id) => !incomingIds.has(id))
//   if (removedIds.length > 0) {
//     const { error: delError } = await supabase
//       .from("questions")
//       .delete()
//       .in("id", removedIds)
//     if (delError) throw new Error("Failed to delete removed questions: " + delError.message)
//   }

//   if (questions.length === 0) return

//   const { data: upsertedQuestions, error: qError } = await supabase
//     .from("questions")
//     .upsert(
//       questions.map((q, i) => ({
//         id: q.id,
//         test_id: testId,
//         question_text: q.question_text,
//         question_type: q.question_type,
//         marks: q.marks,
//         order_index: i + 1,
//         explanation: q.explanation?.trim() || null,
//       })),
//       { onConflict: "id" }
//     )
//     .select("id, order_index")

//   if (qError || !upsertedQuestions)
//     throw new Error("Failed to upsert questions: " + (qError?.message ?? "unknown"))

//   const questionIds = upsertedQuestions.map((q) => q.id)

//   const { error: delOptError } = await supabase
//     .from("options")
//     .delete()
//     .in("question_id", questionIds)
//   if (delOptError) throw new Error("Failed to clear options: " + delOptError.message)

//   const optionsPayload: any[] = []

//   for (const dbQ of upsertedQuestions) {
//     const localQ = questions[dbQ.order_index - 1]
//     if (!localQ) continue
//     localQ.options.forEach((opt, oi) => {
//       optionsPayload.push({
//         question_id: dbQ.id,
//         option_text: opt.option_text,
//         is_correct: opt.is_correct,
//         order_index: oi + 1,
//       })
//     })
//   }

//   if (optionsPayload.length > 0) {
//     const { error: optError } = await supabase.from("options").insert(optionsPayload)
//     if (optError) throw new Error("Failed to insert options: " + optError.message)
//   }

//   const { error: delQtError } = await supabase
//     .from("question_tags")
//     .delete()
//     .in("question_id", questionIds)
//   if (delQtError) throw new Error("Failed to clear question tags: " + delQtError.message)

//   const allTagNames = [
//     ...new Set(
//       questions.flatMap((q) => q.tag_names.map((t) => t.trim()).filter(Boolean))
//     ),
//   ]

//   if (allTagNames.length > 0) {
//     await supabase
//       .from("tags")
//       .upsert(allTagNames.map((name) => ({ name })), { onConflict: "name" })

//     const { data: tagRecords } = await supabase
//       .from("tags")
//       .select("id, name")
//       .in("name", allTagNames)

//     const tagMap: Record<string, string> = Object.fromEntries(
//       (tagRecords ?? []).map((t) => [t.name, t.id])
//     )

//     const questionTagsPayload: any[] = []

//     for (const dbQ of upsertedQuestions) {
//       const localQ = questions[dbQ.order_index - 1]
//       if (!localQ) continue
//       for (const tagName of localQ.tag_names) {
//         const tagId = tagMap[tagName.trim()]
//         if (tagId) questionTagsPayload.push({ question_id: dbQ.id, tag_id: tagId })
//       }
//     }

//     if (questionTagsPayload.length > 0) {
//       const { error: qtError } = await supabase
//         .from("question_tags")
//         .insert(questionTagsPayload)
//       if (qtError) throw new Error("Failed to link tags: " + qtError.message)
//     }
//   }
// }

// export async function loadTestAction(
//   testId: string,
//   userId: string
// ): Promise<InitialTestData | null> {
//   const supabase = await createClient()

//   const { data: test } = await supabase
//     .from("tests")
//     .select(`
//       title, description, instructions,
//       time_limit_seconds, available_from, available_until, status,
//       questions (
//         id, question_text, question_type, marks, order_index, explanation,
//         options ( id, option_text, is_correct, order_index ),
//         question_tags ( tags ( id, name ) )
//       )
//     `)
//     .eq("id", testId)
//     .eq("institute_id", userId)
//     .single()

//   if (!test) return null

//   return {
//     settings: {
//       title: test.title ?? "",
//       description: test.description ?? "",
//       instructions: test.instructions ?? "",
//       time_limit_minutes: test.time_limit_seconds
//         ? String(test.time_limit_seconds / 60)
//         : "",
//       available_from: test.available_from ?? "",
//       available_until: test.available_until ?? "",
//     },
//     status: test.status as "draft" | "published",
//     questions: (test.questions ?? [])
//       .sort((a: any, b: any) => a.order_index - b.order_index)
//       .map((q: any) => ({
//         id: q.id,
//         question_text: q.question_text,
//         question_type: q.question_type,
//         marks: q.marks,
//         order_index: q.order_index,
//         explanation: q.explanation ?? "",
//         tag_names: (q.question_tags ?? [])
//           .map((qt: any) => qt.tags?.name)
//           .filter(Boolean),
//         options: (q.options ?? [])
//           .sort((a: any, b: any) => a.order_index - b.order_index)
//           .map((o: any) => ({
//             _key: o.id,
//             option_text: o.option_text,
//             is_correct: o.is_correct,
//           })),
//       })),
//   }
// }

// export async function saveDraftAction(
//   testId: string,
//   settings: SettingsForm,
//   questions: LocalQuestion[]
// ): Promise<void> {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) throw new Error("Not authenticated")

//   await saveTestToDb(testId, user.id, settings, questions, "draft")
//   revalidatePath("/~/tests")
// }

// export async function publishTestAction(
//   testId: string,
//   settings: SettingsForm,
//   questions: LocalQuestion[]
// ): Promise<void> {
//   if (!settings.title.trim()) throw new Error("Title is required.")
//   if (questions.length === 0) throw new Error("Add at least one question.")

//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) throw new Error("Not authenticated")

//   await saveTestToDb(testId, user.id, settings, questions, "published")
//   revalidatePath("/~/tests")
//   redirect(`/~/tests/${testId}`)
// }

// // ─── AI Question Generation ───────────────────────────────────────────────────

// const DIFFICULTY_MARKS: Record<AiGenerateForm["difficulty"], number> = {
//   easy: 1,
//   medium: 2,
//   hard: 3,
// }

// /**
//  * Cleans raw AI output and enforces correctness rules before returning to UI:
//  * - single_correct  → exactly 1 correct option (pins first encountered correct, resets rest)
//  * - multiple_correct → at least 2 correct options (forces first 2 if model under-counted)
//  * - Drops questions with missing text or fewer than 2 options
//  */
// function sanitizeQuestions(raw: any[], marksDefault: number): QuestionForm[] {
//   return raw
//     .filter(
//       (q) =>
//         q?.question_text?.trim() &&
//         Array.isArray(q?.options) &&
//         q.options.length >= 2
//     )
//     .map((q): QuestionForm => {
//       const qType: "single_correct" | "multiple_correct" =
//         q.question_type === "multiple_correct" ? "multiple_correct" : "single_correct"

//       let options: OptionForm[] = (q.options as any[]).map((o) => ({
//         _key: crypto.randomUUID(),
//         option_text: String(o.option_text ?? "").trim(),
//         is_correct: !!o.is_correct,
//       }))

//       if (qType === "single_correct") {
//         // Pin first correct option; reset all others to false
//         let pinned = false
//         options = options.map((o, i) => {
//           if (o.is_correct && !pinned) {
//             pinned = true
//             return o
//           }
//           // If no correct option found at all, make the first one correct
//           if (i === options.length - 1 && !pinned) {
//             return { ...o, is_correct: true }
//           }
//           return { ...o, is_correct: false }
//         })
//       } else {
//         // Ensure at least 2 correct options for multiple_correct
//         const correctCount = options.filter((o) => o.is_correct).length
//         if (correctCount < 2) {
//           let forced = 0
//           options = options.map((o) => {
//             if (forced < 2 && !o.is_correct) {
//               forced++
//               return { ...o, is_correct: true }
//             }
//             return o
//           })
//         }
//       }

//       return {
//         question_text: String(q.question_text).trim(),
//         question_type: qType,
//         marks: String(q.marks ?? marksDefault),
//         explanation: String(q.explanation ?? "").trim(),
//         tag_names: Array.isArray(q.tag_names)
//           ? q.tag_names.map((t: any) => String(t).trim()).filter(Boolean)
//           : [],
//         options,
//       }
//     })
// }

// export async function generateQuestionsAction(
//   input: AiGenerateForm
// ): Promise<QuestionForm[]> {
//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey) throw new Error("AI generation is not configured.")

//   const count = Math.min(20, Math.max(1, parseInt(input.count, 10) || 5))
//   const marksDefault = DIFFICULTY_MARKS[input.difficulty]

//   const typeInstruction =
//     input.question_type === "mixed"
//       ? `Distribute types evenly: roughly half "single_correct" (exactly 1 correct option) and half "multiple_correct" (2–3 correct options).`
//       : input.question_type === "multiple_correct"
//       ? `All questions must be "multiple_correct" with exactly 2–3 correct options out of 4.`
//       : `All questions must be "single_correct" with exactly 1 correct option out of 4.`

//   const schema = {
//     type: SchemaType.ARRAY,
//     items: {
//       type: SchemaType.OBJECT,
//       properties: {
//         question_text: { type: SchemaType.STRING },
//         question_type: {
//           type: SchemaType.STRING,
//           enum: ["single_correct", "multiple_correct"],
//         },
//         marks: { type: SchemaType.NUMBER },
//         explanation: { type: SchemaType.STRING },
//         tag_names: {
//           type: SchemaType.ARRAY,
//           items: { type: SchemaType.STRING },
//         },
//         options: {
//           type: SchemaType.ARRAY,
//           items: {
//             type: SchemaType.OBJECT,
//             properties: {
//               option_text: { type: SchemaType.STRING },
//               is_correct: { type: SchemaType.BOOLEAN },
//             },
//             required: ["option_text", "is_correct"],
//           },
//         },
//       },
//       required: [
//         "question_text",
//         "question_type",
//         "marks",
//         "explanation",
//         "tag_names",
//         "options",
//       ],
//     },
//   } as const

//   // System instruction is set at model level so it acts as a persistent role
//   // across retries without being diluted by the user-turn prompt
//   const genAI = new GoogleGenerativeAI(apiKey)
//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     systemInstruction: `You are an expert exam question author for educational assessments.

// STRICT RULES you must follow for every question:
// 1. Every question has EXACTLY 4 options — no more, no less.
// 2. "single_correct" → exactly 1 option with is_correct=true; the other 3 must be is_correct=false.
// 3. "multiple_correct" → exactly 2 or 3 options with is_correct=true; the rest must be is_correct=false.
// 4. All distractors (incorrect options) must be plausible but unambiguously wrong to a knowledgeable person.
// 5. The "explanation" field must (a) confirm why the correct answer(s) are right, and (b) briefly explain why the main distractor is wrong.
// 6. "tag_names": provide 1–3 short topic tags (e.g. "photosynthesis", "linear algebra", "Ohm's law").
// 7. Assign marks based on difficulty — easy: ${DIFFICULTY_MARKS.easy}, medium: ${DIFFICULTY_MARKS.medium}, hard: ${DIFFICULTY_MARKS.hard}.
// 8. Vary cognitive levels across the batch: include recall, application, and analysis questions.
// 9. Never repeat similar or near-identical questions within the same batch.`,
//   })

//   const prompt = `Generate exactly ${count} questions on the topic: "${input.topic}".
// Difficulty: ${input.difficulty}. Default marks per question: ${marksDefault}.
// ${typeInstruction}`

//   const attempt = async (): Promise<QuestionForm[]> => {
//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig: {
//         responseMimeType: "application/json",
//         responseSchema: schema as any,
//         temperature: 0.65,
//         topP: 0.95,
//       },
//     })

//     const text = result.response.text()
//     const parsed: any[] = JSON.parse(text)
//     const questions = sanitizeQuestions(parsed, marksDefault)

//     if (questions.length === 0) {
//       throw new Error("No valid questions returned by the AI. Please try again.")
//     }

//     return questions
//   }

//   try {
//     return await attempt()
//   } catch (firstError) {
//     // One silent retry to handle transient model / JSON parse failures
//     try {
//       return await attempt()
//     } catch (retryError) {
//       console.error("[generateQuestionsAction] Failed after retry:", retryError)
//       throw new Error(
//         retryError instanceof Error
//           ? `AI generation failed: ${retryError.message}`
//           : "Failed to generate questions. Please try again."
//       )
//     }
//   }
// }




"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

// --- Shared types ---
export type SettingsForm = {
  title: string
  description: string
  instructions: string
  time_limit_minutes: string
  available_from: string
  available_until: string
}

export type OptionForm = {
  _key: string
  option_text: string
  is_correct: boolean
}

export type LocalQuestion = {
  id: string
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: number
  order_index: number
  tag_names: string[]
  options: OptionForm[]
  explanation: string
}

export type QuestionForm = {
  question_text: string
  question_type: "single_correct" | "multiple_correct"
  marks: string
  explanation: string
  options: OptionForm[]
  tag_names: string[]
}

export type AiGenerateForm = {
  topic: string
  count: string
  difficulty: "easy" | "medium" | "hard"
  question_type: "single_correct" | "multiple_correct" | "mixed"
}

export type InitialTestData = {
  settings: SettingsForm
  questions: LocalQuestion[]
  status: "draft" | "published"
}

// --- Database Helpers ---
async function saveTestToDb(
  testId: string,
  userId: string,
  settings: SettingsForm,
  questions: LocalQuestion[],
  status: "draft" | "published"
): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("tests")
    .select("institute_id")
    .eq("id", testId)
    .maybeSingle()

  if (existing && existing.institute_id !== userId) {
    throw new Error("Access denied.")
  }

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

  const { data: existingRows } = await supabase
    .from("questions")
    .select("id")
    .eq("test_id", testId)

  const existingIds = new Set((existingRows ?? []).map((r) => r.id as string))
  const incomingIds = new Set(questions.map((q) => q.id))

  const removedIds = [...existingIds].filter((id) => !incomingIds.has(id))
  if (removedIds.length > 0) {
    const { error: delError } = await supabase
      .from("questions")
      .delete()
      .in("id", removedIds)
    if (delError) throw new Error("Failed to delete removed questions: " + delError.message)
  }

  if (questions.length === 0) return

  const { data: upsertedQuestions, error: qError } = await supabase
    .from("questions")
    .upsert(
      questions.map((q, i) => ({
        id: q.id,
        test_id: testId,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        order_index: i + 1,
        explanation: q.explanation?.trim() || null,
      })),
      { onConflict: "id" }
    )
    .select("id, order_index")

  if (qError || !upsertedQuestions)
    throw new Error("Failed to upsert questions: " + (qError?.message ?? "unknown"))

  const questionIds = upsertedQuestions.map((q) => q.id)

  const { error: delOptError } = await supabase
    .from("options")
    .delete()
    .in("question_id", questionIds)
  if (delOptError) throw new Error("Failed to clear options: " + delOptError.message)

  const optionsPayload: any[] = []

  for (const dbQ of upsertedQuestions) {
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

  const { error: delQtError } = await supabase
    .from("question_tags")
    .delete()
    .in("question_id", questionIds)
  if (delQtError) throw new Error("Failed to clear question tags: " + delQtError.message)

  const allTagNames = [
    ...new Set(
      questions.flatMap((q) => q.tag_names.map((t) => t.trim()).filter(Boolean))
    ),
  ]

  if (allTagNames.length > 0) {
    await supabase
      .from("tags")
      .upsert(allTagNames.map((name) => ({ name })), { onConflict: "name" })

    const { data: tagRecords } = await supabase
      .from("tags")
      .select("id, name")
      .in("name", allTagNames)

    const tagMap: Record<string, string> = Object.fromEntries(
      (tagRecords ?? []).map((t) => [t.name, t.id])
    )

    const questionTagsPayload: any[] = []

    for (const dbQ of upsertedQuestions) {
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

export async function loadTestAction(
  testId: string,
  userId: string
): Promise<InitialTestData | null> {
  const supabase = await createClient()

  const { data: test } = await supabase
    .from("tests")
    .select(`
      title, description, instructions,
      time_limit_seconds, available_from, available_until, status,
      questions (
        id, question_text, question_type, marks, order_index, explanation,
        options ( id, option_text, is_correct, order_index ),
        question_tags ( tags ( id, name ) )
      )
    `)
    .eq("id", testId)
    .eq("institute_id", userId)
    .single()

  if (!test) return null

  return {
    settings: {
      title: test.title ?? "",
      description: test.description ?? "",
      instructions: test.instructions ?? "",
      time_limit_minutes: test.time_limit_seconds
        ? String(test.time_limit_seconds / 60)
        : "",
      available_from: test.available_from ?? "",
      available_until: test.available_until ?? "",
    },
    status: test.status as "draft" | "published",
    questions: (test.questions ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        order_index: q.order_index,
        explanation: q.explanation ?? "",
        tag_names: (q.question_tags ?? [])
          .map((qt: any) => qt.tags?.name)
          .filter(Boolean),
        options: (q.options ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((o: any) => ({
            _key: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
      })),
  }
}

export async function saveDraftAction(
  testId: string,
  settings: SettingsForm,
  questions: LocalQuestion[]
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await saveTestToDb(testId, user.id, settings, questions, "draft")
  revalidatePath("/~/tests")
}

export async function publishTestAction(
  testId: string,
  settings: SettingsForm,
  questions: LocalQuestion[]
): Promise<void> {
  if (!settings.title.trim()) throw new Error("Title is required.")
  if (questions.length === 0) throw new Error("Add at least one question.")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await saveTestToDb(testId, user.id, settings, questions, "published")
  revalidatePath("/~/tests")
  redirect(`/~/tests/${testId}`)
}

// ─── AI Question Generation ───────────────────────────────────────────────────

// ✅ CHANGED: All difficulty levels now use 1 mark
const DIFFICULTY_MARKS: Record<AiGenerateForm["difficulty"], number> = {
  easy: 1,
  medium: 1,
  hard: 1,
}

/**
 * Cleans raw AI output and enforces correctness rules before returning to UI:
 * - single_correct  → exactly 1 correct option (pins first encountered correct, resets rest)
 * - multiple_correct → at least 2 correct options (forces first 2 if model under-counted)
 * - Drops questions with missing text or fewer than 2 options
 */
function sanitizeQuestions(raw: any[], marksDefault: number): QuestionForm[] {
  return raw
    .filter(
      (q) =>
        q?.question_text?.trim() &&
        Array.isArray(q?.options) &&
        q.options.length >= 2
    )
    .map((q): QuestionForm => {
      const qType: "single_correct" | "multiple_correct" =
        q.question_type === "multiple_correct" ? "multiple_correct" : "single_correct"

      let options: OptionForm[] = (q.options as any[]).map((o) => ({
        _key: crypto.randomUUID(),
        option_text: String(o.option_text ?? "").trim(),
        is_correct: !!o.is_correct,
      }))

      if (qType === "single_correct") {
        let pinned = false
        options = options.map((o, i) => {
          if (o.is_correct && !pinned) {
            pinned = true
            return o
          }
          if (i === options.length - 1 && !pinned) {
            return { ...o, is_correct: true }
          }
          return { ...o, is_correct: false }
        })
      } else {
        const correctCount = options.filter((o) => o.is_correct).length
        if (correctCount < 2) {
          let forced = 0
          options = options.map((o) => {
            if (forced < 2 && !o.is_correct) {
              forced++
              return { ...o, is_correct: true }
            }
            return o
          })
        }
      }

      return {
        question_text: String(q.question_text).trim(),
        question_type: qType,
        marks: String(q.marks ?? marksDefault),
        explanation: String(q.explanation ?? "").trim(),
        tag_names: Array.isArray(q.tag_names)
          ? q.tag_names.map((t: any) => String(t).trim()).filter(Boolean)
          : [],
        options,
      }
    })
}

export async function generateQuestionsAction(
  input: AiGenerateForm
): Promise<QuestionForm[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("AI generation is not configured.")

  const count = Math.min(20, Math.max(1, parseInt(input.count, 10) || 5))
  const marksDefault = DIFFICULTY_MARKS[input.difficulty] // always 1

  const typeInstruction =
    input.question_type === "mixed"
      ? `Distribute types evenly: roughly half "single_correct" (exactly 1 correct option) and half "multiple_correct" (2–3 correct options).`
      : input.question_type === "multiple_correct"
      ? `All questions must be "multiple_correct" with exactly 2–3 correct options out of 4.`
      : `All questions must be "single_correct" with exactly 1 correct option out of 4.`

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        question_text: { type: SchemaType.STRING },
        question_type: {
          type: SchemaType.STRING,
          enum: ["single_correct", "multiple_correct"],
        },
        marks: { type: SchemaType.NUMBER },
        explanation: { type: SchemaType.STRING },
        tag_names: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        options: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              option_text: { type: SchemaType.STRING },
              is_correct: { type: SchemaType.BOOLEAN },
            },
            required: ["option_text", "is_correct"],
          },
        },
      },
      required: [
        "question_text",
        "question_type",
        "marks",
        "explanation",
        "tag_names",
        "options",
      ],
    },
  } as const

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are an expert exam question author for educational assessments.

STRICT RULES you must follow for every question:
1. Every question has EXACTLY 4 options — no more, no less.
2. "single_correct" → exactly 1 option with is_correct=true; the other 3 must be is_correct=false.
3. "multiple_correct" → exactly 2 or 3 options with is_correct=true; the rest must be is_correct=false.
4. All distractors (incorrect options) must be plausible but unambiguously wrong to a knowledgeable person.
5. The "explanation" field must (a) confirm why the correct answer(s) are right, and (b) briefly explain why the main distractor is wrong.
6. "tag_names": provide 1–3 short topic tags (e.g. "photosynthesis", "linear algebra", "Ohm's law").
7. Every question must have marks = 1, regardless of difficulty.
8. Vary cognitive levels across the batch: include recall, application, and analysis questions.
9. Never repeat similar or near-identical questions within the same batch.`,
  })

  const prompt = `Generate exactly ${count} questions on the topic: "${input.topic}".
Difficulty: ${input.difficulty}. Each question carries 1 mark.
${typeInstruction}`

  const attempt = async (): Promise<QuestionForm[]> => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.65,
        topP: 0.95,
      },
    })

    const text = result.response.text()
    const parsed: any[] = JSON.parse(text)
    const questions = sanitizeQuestions(parsed, marksDefault)

    if (questions.length === 0) {
      throw new Error("No valid questions returned by the AI. Please try again.")
    }

    return questions
  }

  try {
    return await attempt()
  } catch (firstError) {
    try {
      return await attempt()
    } catch (retryError) {
      console.error("[generateQuestionsAction] Failed after retry:", retryError)
      throw new Error(
        retryError instanceof Error
          ? `AI generation failed: ${retryError.message}`
          : "Failed to generate questions. Please try again."
      )
    }
  }
}
