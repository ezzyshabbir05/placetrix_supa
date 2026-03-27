"use server"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"


// ─── Guard helper ─────────────────────────────────────────────────────────────
// Verifies the authenticated user is the institute that owns the test.

async function assertOwner(testId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  if (!user) throw new Error("Not authenticated")

  const { data: test, error } = await supabase
    .from("tests")
    .select("institute_id")
    .eq("id", testId)
    .single()

  if (error || !test) throw new Error("Test not found")
  if (test.institute_id !== user.sub) throw new Error("Forbidden")

  return user.sub as string
}


// ─── Toggle Results ────────────────────────────────────────────────────────────
// Flips results_available. Students can/cannot see scores after this.

export async function toggleResultsAction(testId: string): Promise<void> {
  await assertOwner(testId)
  const supabase = await createClient()

  const { data: current } = await supabase
    .from("tests")
    .select("results_available")
    .eq("id", testId)
    .single()

  const { error } = await supabase
    .from("tests")
    .update({ results_available: !current?.results_available })
    .eq("id", testId)

  if (error) throw new Error("Failed to toggle results: " + error.message)
  revalidatePath(`/~/tests/${testId}`)
}


// ─── Toggle Publish ────────────────────────────────────────────────────────────
// draft → published  or  published → draft.
// Archived tests are not touched here.

export async function togglePublishAction(testId: string): Promise<void> {
  await assertOwner(testId)
  const supabase = await createClient()

  const { data: current } = await supabase
    .from("tests")
    .select("status")
    .eq("id", testId)
    .single()

  if (current?.status === "archived") throw new Error("Cannot publish an archived test.")

  const next = current?.status === "published" ? "draft" : "published"

  const { error } = await supabase
    .from("tests")
    .update({ status: next })
    .eq("id", testId)

  if (error) throw new Error("Failed to update status: " + error.message)
  revalidatePath(`/~/tests/${testId}`)
  revalidatePath("/~/tests")
}


// ─── Delete Test ───────────────────────────────────────────────────────────────
// Hard-deletes the test row. Cascade removes questions, options, attempts.

export async function deleteTestAction(testId: string): Promise<void> {
  await assertOwner(testId)
  const supabase = await createClient()

  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("id", testId)

  if (error) throw new Error("Failed to delete test: " + error.message)

  revalidatePath("/~/tests")
  redirect("/~/tests")
}