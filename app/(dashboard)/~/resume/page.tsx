// app/resume/page.tsx
import { ResumeGeneratorClient } from "./ResumeGeneratorClient"

export const metadata = {
  title: "Resume Builder",
  description: "ATS-optimised resume builder with a LaTeX-inspired layout",
}

export default function ResumePage() {
  return <ResumeGeneratorClient />
}