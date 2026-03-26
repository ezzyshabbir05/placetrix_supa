import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { redirect } from "next/navigation"
import { StudentsListClient, Student } from "./StudentsListClient"

export const metadata = {
  title: "Students | PlaceTrix",
  description: "View and manage students registered in your institution.",
}

export default async function StudentsPage() {
  const profile = await getUserProfile()
  if (!profile || profile.account_type !== "institute") {
    redirect("/~/home")
  }

  const supabase = await createClient()

  const { data: studentsData, error } = await supabase
    .from("candidate_profiles")
    .select(`
      profile_id,
      course_name,
      passout_year,
      university_prn,
      institute_verified,
      cgpa,
      profile_image_path,
      created_at,
      profiles!inner (
        display_name,
        email
      )
    `)
    .eq("institute_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching students:", error)
  }

  const students: Student[] = (studentsData || []).map((s: any) => ({
    profile_id: s.profile_id,
    display_name: s.profiles.display_name,
    email: s.profiles.email,
    course_name: s.course_name,
    passout_year: s.passout_year,
    university_prn: s.university_prn,
    institute_verified: s.institute_verified,
    cgpa: s.cgpa,
    profile_image_path: s.profile_image_path,
    created_at: s.created_at,
  }))

  return (
    <div className="flex flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          {students.length} students currently registered.
        </p>
      </div>
      <StudentsListClient students={students} />
    </div>
  )
}
