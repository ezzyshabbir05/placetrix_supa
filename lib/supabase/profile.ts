import { createClient } from "@/lib/supabase/server"
import { cache } from "react"

export type AccountType = "candidate" | "institute" | "admin" | "recruiter"

export interface UserProfile {
  id: string
  display_name: string
  email: string
  /** Raw value stored in DB — either a Supabase storage path or an external OAuth URL. */
  avatar_path: string | null
  username: string | null
  account_type: AccountType
}

/**
 * Fetches the authenticated user's profile from public.profiles.
 * Returns null if unauthenticated or profile not found.
 */
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, account_type, avatar_path, username")
    .eq("id", user.id)
    .single()

  if (error || !profile) return null

  return profile as UserProfile
})
