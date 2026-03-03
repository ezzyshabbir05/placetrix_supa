import { createClient } from "@/lib/supabase/server";

export type AccountType = "candidate" | "institute" | "admin" | "recruiter";

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  account_type: AccountType;
}

/**
 * Fetches the authenticated user's profile from public.profiles.
 * Returns null if unauthenticated or profile not found.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, account_type")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return profile as UserProfile;
}