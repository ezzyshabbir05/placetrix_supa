"use client"

import * as React from "react"
import { analyzeResumeAction, type ResumeAnalysisResult } from "./actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import {
  IconUpload,
  IconFileText,
  IconX,
  IconSparkles,
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconTarget,
  IconBulb,
  IconQuote,
  IconLayout,
  IconBriefcase,
  IconCode,
  IconTools,
  IconUsers,
  IconStarFilled,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react"


// ─── ATS Score Ring ───────────────────────────────────────────────────────────

function ATSScoreRing({ score }: { score: number }) {
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", bg: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-400", label: "Excellent" }
    if (s >= 65) return { stroke: "#3b82f6", bg: "from-blue-500/20 to-blue-500/5", text: "text-blue-400", label: "Good" }
    if (s >= 45) return { stroke: "#f59e0b", bg: "from-amber-500/20 to-amber-500/5", text: "text-amber-400", label: "Fair" }
    return { stroke: "#ef4444", bg: "from-red-500/20 to-red-500/5", text: "text-red-400", label: "Needs Work" }
  }

  const colors = getScoreColor(score)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${colors.bg} backdrop-blur-xl p-8`}
    >
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/5"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`text-4xl font-bold tabular-nums ${colors.text}`}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-3 text-center"
      >
        <p className="text-sm font-semibold text-foreground">ATS Score</p>
        <p className={`text-xs font-medium ${colors.text}`}>{colors.label}</p>
      </motion.div>
    </motion.div>
  )
}


// ─── Section Card ─────────────────────────────────────────────────────────────

function AnalysisCard({
  title,
  icon,
  children,
  delay = 0,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  delay?: number
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-3"
    >
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {collapsible && (
          <span className="text-muted-foreground">
            {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


// ─── Chip List ────────────────────────────────────────────────────────────────

function ChipList({
  items,
  variant,
}: {
  items: string[]
  variant: "success" | "danger" | "neutral"
}) {
  const colorMap = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">None identified</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorMap[variant]}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function ResumeAnalyzerClient({ initialDescription = "" }: { initialDescription?: string }) {
  const [file, setFile] = React.useState<File | null>(null)
  const [jobDescription, setJobDescription] = React.useState(initialDescription)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [result, setResult] = React.useState<ResumeAnalysisResult | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const canAnalyze = file && jobDescription.trim().length > 20 && !isAnalyzing

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile)
    } else {
      toast.error("Please upload a PDF file")
    }
  }, [])

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected?.type === "application/pdf") {
      setFile(selected)
    } else if (selected) {
      toast.error("Please upload a PDF file")
    }
  }, [])

  const handleAnalyze = React.useCallback(async () => {
    if (!file || !jobDescription.trim()) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("resume", file)
      formData.append("jobDescription", jobDescription)

      const analysis = await analyzeResumeAction(formData)
      setResult(analysis)

      // Cache result for the Portfolio page to consume
      try {
        localStorage.setItem(
          "skillbridge_resume_insights",
          JSON.stringify({
            atsScore: analysis.atsScore,
            extractedSkills: analysis.keywordAnalysis.matched,
            keywords: analysis.keywordAnalysis.missing.concat(analysis.keywordAnalysis.matched),
            suggestions: analysis.improvements.slice(0, 3),
            analyzedAt: new Date().toISOString(),
          })
        )
      } catch { /* localStorage might be full — ignore */ }

      toast.success("Resume analysis complete!")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to analyze resume. Please try again."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }, [file, jobDescription])

  const handleReset = React.useCallback(() => {
    setFile(null)
    setJobDescription("")
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  return (
    <div className="min-h-screen w-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Resume Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload your resume and a job description to get an AI-powered ATS evaluation with actionable feedback.
          </p>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left Panel: Inputs ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                p-8 text-center transition-all duration-200 cursor-pointer min-h-[180px]
                ${isDragOver
                  ? "border-blue-500/50 bg-blue-500/5"
                  : file
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 bg-card hover:border-white/20 hover:bg-white/[0.02]"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                    <IconFileText size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <IconX size={14} />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5">
                    <IconUpload size={24} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop your resume here
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      or click to browse · PDF only · Max 5 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label htmlFor="job-description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Job Description
              </label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {jobDescription.length > 0 && (
                  <span className={jobDescription.trim().length > 20 ? "text-emerald-400" : "text-amber-400"}>
                    {jobDescription.trim().length} characters
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="flex-1 h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-muted disabled:text-muted-foreground"
              >
                {isAnalyzing ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <IconSparkles size={16} />
                    Analyze Resume
                  </>
                )}
              </Button>
              {result && (
                <Button variant="outline" onClick={handleReset} className="h-11">
                  Clear
                </Button>
              )}
            </div>

            {/* Analyzing skeleton */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-white/[0.06] bg-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing your resume against the job description…
                  </p>
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 rounded bg-white/5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                      <div className="h-2 w-full rounded bg-white/[0.03] animate-pulse" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                      <div className="h-2 w-3/4 rounded bg-white/[0.03] animate-pulse" style={{ animationDelay: `${i * 150 + 150}ms` }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Panel: Results ──────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* ATS Score + Summary Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ATSScoreRing score={result.atsScore} />
                    <div className="sm:col-span-2 flex flex-col gap-4">
                      {/* Match Summary */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 rounded-xl border border-white/[0.06] bg-card p-5"
                      >
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Match Summary</p>
                        <p className="text-sm text-foreground leading-relaxed">{result.matchSummary}</p>
                      </motion.div>

                      {/* Final Verdict */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className={`rounded-xl border p-4 flex items-start gap-3 ${
                          result.finalVerdict.shortlist
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : "border-amber-500/20 bg-amber-500/5"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${result.finalVerdict.shortlist ? "text-emerald-400" : "text-amber-400"}`}>
                          {result.finalVerdict.shortlist ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {result.finalVerdict.shortlist ? "Likely to be Shortlisted" : "Needs Improvement"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{result.finalVerdict.reason}</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Keyword Analysis */}
                  <AnalysisCard title="Keyword Analysis" icon={<IconTarget size={16} />} delay={0.4}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
                          <IconCheck size={12} /> Matched Keywords
                        </p>
                        <ChipList items={result.keywordAnalysis.matched} variant="success" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1">
                          <IconX size={12} /> Missing Keywords
                        </p>
                        <ChipList items={result.keywordAnalysis.missing} variant="danger" />
                      </div>
                    </div>
                  </AnalysisCard>

                  {/* Skill Gap */}
                  <AnalysisCard title="Skill Gap Analysis" icon={<IconCode size={16} />} delay={0.5}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IconCode size={12} /> Technical Skills
                        </p>
                        <ChipList items={result.skillGap.technical} variant="danger" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IconTools size={12} /> Tools & Technologies
                        </p>
                        <ChipList items={result.skillGap.tools} variant="danger" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IconUsers size={12} /> Soft Skills
                        </p>
                        <ChipList items={result.skillGap.soft} variant="neutral" />
                      </div>
                    </div>
                  </AnalysisCard>

                  {/* Section Feedback */}
                  <AnalysisCard title="Section-wise Feedback" icon={<IconLayout size={16} />} delay={0.6} collapsible defaultOpen={true}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        { key: "structure" as const, label: "Structure", icon: <IconLayout size={14} /> },
                        { key: "projects" as const, label: "Projects", icon: <IconStarFilled size={14} /> },
                        { key: "experience" as const, label: "Experience", icon: <IconBriefcase size={14} /> },
                        { key: "skills" as const, label: "Skills", icon: <IconCode size={14} /> },
                      ]).map(({ key, label, icon }) => (
                        <div key={key} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <span className="text-muted-foreground">{icon}</span>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.sectionFeedback[key]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AnalysisCard>

                  {/* Actionable Improvements */}
                  <AnalysisCard title="Actionable Improvements" icon={<IconBulb size={16} />} delay={0.7} collapsible>
                    <ol className="space-y-2">
                      {result.improvements.map((item, i) => (
                        <li key={i} className="flex gap-2.5 text-xs text-muted-foreground leading-relaxed">
                          <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </AnalysisCard>

                  {/* Improved Bullet Points */}
                  {result.improvedBullets.length > 0 && (
                    <AnalysisCard title="Improved Resume Bullets" icon={<IconQuote size={16} />} delay={0.8} collapsible>
                      <div className="space-y-2">
                        {result.improvedBullets.map((bullet, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-white/[0.02] border-l-2 border-blue-500/40 pl-3.5 pr-3 py-2.5"
                          >
                            <p className="text-xs text-foreground leading-relaxed">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    </AnalysisCard>
                  )}
                </motion.div>
              ) : !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-card/50 p-16 text-center min-h-[400px]"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
                    <IconSparkles size={28} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Your analysis will appear here
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[260px]">
                    Upload your resume PDF and paste a job description, then click Analyze to get started.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
