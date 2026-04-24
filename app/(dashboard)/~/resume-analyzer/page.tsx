import { ResumeAnalyzerClient } from "./ResumeAnalyzerClient"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Resume Analyzer | PlaceTrix",
  description: "AI-powered ATS resume analysis with keyword matching, skill gap identification, and actionable improvements.",
}

export default async function ResumeAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { job_id } = await searchParams;
  let prefillDescription = ""

  if (job_id && typeof job_id === "string") {
    const supabase = await createClient()
    // @ts-ignore
    const { data } = await supabase
      .from("job_postings" as any)
      .select(`
        title, 
        description, 
        requirements,
        skills,
        profiles!inner (
          recruiter_profiles (
            company_name
          )
        )
      `)
      .eq("id", job_id)
      .single()

    const anyData = data as any;
    if (anyData) {
      const rpArray = anyData.profiles?.recruiter_profiles;
      const rp = Array.isArray(rpArray) ? rpArray[0] : rpArray;
      const companyName = rp?.company_name ?? "Unknown Company";

      prefillDescription = `Role: ${anyData.title}\nCompany: ${companyName}\n\nDescription:\n${anyData.description}${anyData.requirements ? `\n\nRequirements:\n${anyData.requirements}` : ''}${(anyData.skills && anyData.skills.length > 0) ? `\n\nSkills: ${anyData.skills.join(', ')}` : ''}`
    }
  }

  return <ResumeAnalyzerClient initialDescription={prefillDescription} />
}
