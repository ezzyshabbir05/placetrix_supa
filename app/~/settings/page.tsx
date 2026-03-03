import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { SettingsClient } from "./SettingsClient"

export default async function SettingsPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect("/login")
  }

  const supabase = await createClient()

  if (profile.account_type === "candidate") {
    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .single()

    return (
      <SettingsClient
        role="candidate"
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
      .single()

    return (
      <SettingsClient
        role="institute"
        userProfile={profile}
        initialData={instituteProfile ?? null}
      />
    )
  }

  // Fallback for other roles
  return (
    <SettingsClient
      role={profile.account_type as "candidate" | "institute"}
      userProfile={profile}
      initialData={null}
    />
  )
}