import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { CandidateSettingsClient } from "./CandidateSettingsClient"
import { InstituteSettingsClient } from "./InstituteSettingsClient"

export default async function SettingsPage() {
  const profile = await getUserProfile()
  if (!profile) return null

  const supabase = await createClient()

  if (profile.account_type === "candidate") {
    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle() // Fix: prevents throwing if 0 rows exist

    return (
      <CandidateSettingsClient
        userProfile={profile}
        initialData={candidateProfile ?? null}
      />
    )
  }

  if (profile.account_type === "institute") {
    const { data: instituteProfile } = await supabase
      .from("institute_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle() // Fix: prevents throwing if 0 rows exist

    return (
      <InstituteSettingsClient
        userProfile={profile}
        initialData={instituteProfile ?? null}
      />
    )
  }

  redirect("/~/home")
}