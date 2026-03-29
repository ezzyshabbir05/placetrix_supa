import { createClient } from "@/lib/supabase/server"
import type { AttemptQuestion } from "@/app/(fullscreen)/~/tests/[testId]/attempt/_types"

/**
 * Fetches the questions for a test in a separate, cached block.
 * Uses the Next.js 15+ "use cache" directive to reduce DB load.
 */
export async function getCachedTestQuestions(testId: string): Promise<AttemptQuestion[]> {
  "use cache"
  
  // Tag this cache entry so it can be revalidated when the test is edited.
  // Note: we can't easily use revalidateTag in a simplified setup but 
  // the 'use cache' directive handles basic TTL or manual revalidation.
  
  const supabase = await createClient()
  const { data: rawQuestions, error: qError } = await supabase
    .from("questions")
    .select(
      `id, question_text, question_type, marks, order_index,
       options (id, option_text, order_index),
       question_tags (
         tags (id, name)
       )`
    )
    .eq("test_id", testId)
    .order("order_index")

  if (qError || !rawQuestions) {
    throw new Error("Failed to load questions: " + qError?.message)
  }

  // Shape the results for the client
  return rawQuestions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type as "single_correct" | "multiple_correct",
    marks: q.marks,
    order_index: q.order_index,
    options: ((q.options as any[]) ?? [])
      .map((o) => ({
        id: o.id,
        option_text: o.option_text,
        order_index: o.order_index,
      }))
      .sort((a, b) => a.order_index - b.order_index),
    tags: ((q.question_tags as any[]) ?? [])
      .map((qt) => qt.tags)
      .filter(Boolean)
      .flat(),
  }))
}
