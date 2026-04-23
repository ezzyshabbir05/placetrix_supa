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

  // if (job_id && typeof job_id === "string") {
  //   const supabase = await createClient()
  //   const { data } = await supabase
  //     .from("opportunities")
  //     .select("title, description, required_skills")
  //     .eq("id", job_id)
  //     .single()

  //   if (data) {
  //     prefillDescription = `Role: ${data.title}\n\nDescription:\n${data.description}\n\nRequired Skills: ${(data.required_skills as string[] || []).join(", ")}`
  //   }
  // }

  return <ResumeAnalyzerClient initialDescription={prefillDescription} />
}
