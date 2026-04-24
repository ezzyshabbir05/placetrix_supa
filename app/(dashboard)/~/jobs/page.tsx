import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/profile"
import { JobsClient } from "./JobsClient"
import type { CandidateJobPosting } from "./_types"

export default async function JobsPage() {
  const profile = await getUserProfile()
  if (!profile) redirect("/auth/login")

  // This page is meant for candidates
  if (profile.account_type !== "candidate") {
    redirect("/~/home")
  }

  const supabase = await createClient()

  // Fetch active jobs and join with profiles -> recruiter_profiles for company info
  // @ts-ignore
  const { data: jobsData, error: jobsError } = await supabase
    .from("job_postings" as any)
    .select(`
      *,
      profiles!inner (
        recruiter_profiles (
          company_name,
          industry,
          company_logo_path
        )
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError)
  }

  // Fetch jobs this candidate has already applied to
  // @ts-ignore
  const { data: applicationsData } = await supabase
    .from("job_applications" as any)
    .select("job_id")
    .eq("candidate_id", profile.id)

  const appliedJobIds = new Set((applicationsData ?? []).map((a: any) => a.job_id))

  const jobs: CandidateJobPosting[] = (jobsData ?? []).map((row: any) => {
    // PostgREST might return the one-to-one join as an array or object
    const rpArray = row.profiles?.recruiter_profiles;
    const rp = Array.isArray(rpArray) ? rpArray[0] : rpArray;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      job_type: row.job_type,
      work_mode: row.work_mode,
      location: row.location,
      salary_min: row.salary_min,
      salary_max: row.salary_max,
      salary_currency: row.salary_currency ?? "INR",
      skills: row.skills ?? [],
      application_deadline: row.application_deadline,
      created_at: row.created_at,
      
      // Joined data
      company_name: rp?.company_name ?? "Unknown Company",
      industry: rp?.industry,
      company_logo_path: rp?.company_logo_path,
    }
  })

  return <JobsClient jobs={jobs} appliedJobIds={Array.from(appliedJobIds)} />
}
