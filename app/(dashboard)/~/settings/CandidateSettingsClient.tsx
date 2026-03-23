"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/~/settings/CandidateSettingsClient.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useTransition, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/supabase/profile"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { FloatingSaveBar } from "@/components/ui/floating-save-bar"
import { LoginHistoryTab } from "./LoginHistoryTab"
import { cn } from "@/lib/utils"
import {
  Upload, Plus, Minus, Copy, CalendarIcon, Loader2, Camera,
  CheckCircle2, XCircle, AtSign, Lock,
} from "lucide-react"


// ─── Constants ────────────────────────────────────────────────────────────────


const SOFTWARE_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "PHP", "Ruby", "Swift", "Kotlin", "React", "Angular", "Vue.js", "Next.js",
  "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET",
  "Laravel", "React Native", "Flutter", "HTML", "CSS", "Sass", "Tailwind CSS",
  "Bootstrap", "Material UI", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
  "Firebase", "Oracle", "SQLite", "Git", "GitHub", "GitLab", "Docker",
  "Kubernetes", "Jenkins", "CI/CD", "AWS", "Azure", "Google Cloud", "Heroku",
  "Netlify", "Vercel", "REST API", "GraphQL", "Microservices", "Linux", "Bash",
  "PowerShell", "Agile", "Scrum", "Jira", "TensorFlow", "PyTorch",
  "Machine Learning", "Deep Learning", "Data Science", "Pandas", "NumPy",
  "Scikit-learn", "Selenium", "Jest", "Cypress", "JUnit", "Postman",
  "Figma", "Adobe XD", "Photoshop", "UI/UX Design",
]

const GENDER_OPTIONS = ["Male", "Female", "Other"]
const GENDER_MAP: Record<string, string> = { Male: "M", Female: "F", Other: "O" }
const GENDER_REVERSE: Record<string, string> = { M: "Male", F: "Female", O: "Other" }
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2025 - i))

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/


// ─── Types ────────────────────────────────────────────────────────────────────


type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged"

interface InstituteOption {
  profile_id: string
  institute_name: string
  courses: string[] | null
}

interface Props {
  userProfile: UserProfile
  initialData: Record<string, any> | null
}


// ─── Helpers ──────────────────────────────────────────────────────────────────


function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${d}/${m}/${date.getFullYear()}`
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseLocalDate(str: string): Date {
  return new Date(`${str}T00:00:00`)
}

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  return email[0]?.toUpperCase() ?? "?"
}

function getStorageUrl(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string | null
): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}


// ─── Tab config ───────────────────────────────────────────────────────────────


type Tab = "account" | "security" | "billing" | "notifications" | "history" | "privacy"

const TABS: { value: Tab; label: string }[] = [
  { value: "account",       label: "Account"       },
  { value: "security",      label: "Security"      },
  { value: "billing",       label: "Billing"       },
  { value: "notifications", label: "Notifications" },
  { value: "history",       label: "Login History" },
  { value: "privacy",       label: "Privacy"       },
]


// ─── Username status indicator ────────────────────────────────────────────────


function UsernameStatusIcon({ status }: { status: UsernameStatus }) {
  if (status === "checking")
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  if (status === "available")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "taken" || status === "invalid")
    return <XCircle className="h-4 w-4 text-destructive" />
  return null
}

function usernameStatusMessage(status: UsernameStatus): { text: string; className: string } | null {
  if (status === "checking")   return { text: "Checking availability…",         className: "text-muted-foreground" }
  if (status === "available")  return { text: "Username is available!",          className: "text-emerald-600 dark:text-emerald-400" }
  if (status === "taken")      return { text: "Username is already taken.",      className: "text-destructive" }
  if (status === "invalid")    return { text: "3–20 characters: letters, numbers, underscores only.", className: "text-destructive" }
  if (status === "unchanged")  return { text: "This is your current username.",  className: "text-muted-foreground" }
  return null
}


// ─── Component ────────────────────────────────────────────────────────────────


export function CandidateSettingsClient({ userProfile, initialData }: Props) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("account")


  // ── Username ──────────────────────────────────────────────────────────────

  const [username, setUsername]               = useState(userProfile.username ?? "")
  const [usernameStatus, setUsernameStatus]   = useState<UsernameStatus>("idle")
  const usernameDebounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialUsername                       = useRef(userProfile.username ?? "")


  // ── Profile Picture ───────────────────────────────────────────────────────

  const storedImagePath = useRef<string | null>(initialData?.profile_image_path ?? null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() =>
    getStorageUrl(supabase, "avatars", storedImagePath.current)
  )
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)


  // ── Personal ──────────────────────────────────────────────────────────────

  const [firstName, setFirstName]               = useState(initialData?.first_name ?? "")
  const [middleName, setMiddleName]             = useState(initialData?.middle_name ?? "")
  const [lastName, setLastName]                 = useState(initialData?.last_name ?? "")
  const [gender, setGender]                     = useState(
    initialData?.gender ? (GENDER_REVERSE[initialData.gender] ?? "") : ""
  )
  const [phoneNumber, setPhoneNumber]           = useState(initialData?.phone_number ?? "")
  const [dateOfBirth, setDateOfBirth]           = useState<Date | undefined>(
    initialData?.date_of_birth ? parseLocalDate(initialData.date_of_birth) : undefined
  )
  const [dobOpen, setDobOpen]                   = useState(false)
  const [aadhaarNumber, setAadhaarNumber]       = useState(initialData?.aadhaar_number ?? "")
  const [currentAddress, setCurrentAddress]     = useState(initialData?.current_address ?? "")
  const [permanentAddress, setPermanentAddress] = useState(initialData?.permanent_address ?? "")


  // ── Education ─────────────────────────────────────────────────────────────

  const [instituteId, setInstituteId]           = useState<string>(initialData?.institute_id ?? "")
  const [instituteName, setInstituteName]       = useState("")
  const [courseName, setCourseName]             = useState(initialData?.course_name ?? "")
  const [passoutYear, setPassoutYear]           = useState(
    initialData?.passout_year ? String(initialData.passout_year) : ""
  )
  const [sscPercentage, setSscPercentage]       = useState(
    initialData?.ssc_percentage != null ? String(initialData.ssc_percentage) : ""
  )
  const [sscPassYear, setSscPassYear]           = useState(
    initialData?.ssc_pass_year ? String(initialData.ssc_pass_year) : ""
  )
  const [isHsc, setIsHsc]                       = useState(initialData?.is_hsc ?? false)
  const [hscPercentage, setHscPercentage]       = useState(
    initialData?.hsc_percentage != null ? String(initialData.hsc_percentage) : ""
  )
  const [hscPassYear, setHscPassYear]           = useState(
    initialData?.hsc_pass_year ? String(initialData.hsc_pass_year) : ""
  )
  const [isDiploma, setIsDiploma]               = useState(initialData?.is_diploma ?? false)
  const [diplomaPercentage, setDiplomaPercentage] = useState(
    initialData?.diploma_percentage != null ? String(initialData.diploma_percentage) : ""
  )
  const [diplomaPassYear, setDiplomaPassYear]   = useState(
    initialData?.diploma_pass_year ? String(initialData.diploma_pass_year) : ""
  )
  const [universityPrn, setUniversityPrn]       = useState(initialData?.university_prn ?? "")
  const [sgpaValues, setSgpaValues]             = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => {
      const val = initialData?.[`sgpa_sem${i + 1}`]
      return val != null ? String(val) : ""
    })
  )


  // ── Professional ──────────────────────────────────────────────────────────

  const [selectedSkills, setSelectedSkills]     = useState<string[]>(initialData?.skills ?? [])
  const [linkedinUrl, setLinkedinUrl]           = useState(initialData?.linkedin_url ?? "")
  const [githubUrl, setGithubUrl]               = useState(initialData?.github_url ?? "")
  const [portfolioLinks, setPortfolioLinks]     = useState<string[]>(
    initialData?.portfolio_links?.length ? initialData.portfolio_links : [""]
  )


  // ── Institute Lookup ──────────────────────────────────────────────────────

  const [institutes, setInstitutes]             = useState<InstituteOption[]>([])
  const [availableCourses, setAvailableCourses] = useState<string[]>([])


  // ── Misc ──────────────────────────────────────────────────────────────────

  const [errors, setErrors]   = useState<Record<string, string>>({})
  const skillsAnchor          = useComboboxAnchor()
  const defaultDobDate        = new Date(2000, 0, 1)


  // ── Dirty tracking ────────────────────────────────────────────────────────

  const markDirty = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T | ((prev: T) => T)) => {
        setter(value as any)
        setIsDirty(true)
      },
    []
  )

  const handleFirstName         = markDirty(setFirstName)
  const handleMiddleName        = markDirty(setMiddleName)
  const handleLastName          = markDirty(setLastName)
  const handleGender            = markDirty(setGender)
  const handlePhoneNumber       = markDirty(setPhoneNumber)
  const handleDateOfBirth       = markDirty(setDateOfBirth)
  const handleAadhaarNumber     = markDirty(setAadhaarNumber)
  const handleCurrentAddress    = markDirty(setCurrentAddress)
  const handlePermanentAddress  = markDirty(setPermanentAddress)
  const handleCourseName        = markDirty(setCourseName)
  const handlePassoutYear       = markDirty(setPassoutYear)
  const handleSscPercentage     = markDirty(setSscPercentage)
  const handleSscPassYear       = markDirty(setSscPassYear)
  const handleIsHsc             = markDirty(setIsHsc)
  const handleHscPercentage     = markDirty(setHscPercentage)
  const handleHscPassYear       = markDirty(setHscPassYear)
  const handleIsDiploma         = markDirty(setIsDiploma)
  const handleDiplomaPercentage = markDirty(setDiplomaPercentage)
  const handleDiplomaPassYear   = markDirty(setDiplomaPassYear)
  const handleUniversityPrn     = markDirty(setUniversityPrn)
  const handleSgpaValues        = markDirty(setSgpaValues)
  const handleSelectedSkills    = markDirty(setSelectedSkills)
  const handleLinkedinUrl       = markDirty(setLinkedinUrl)
  const handleGithubUrl         = markDirty(setGithubUrl)
  const handlePortfolioLinks    = markDirty(setPortfolioLinks)


  // ── Username change handler with debounced availability check ─────────────

  function handleUsernameChange(value: string) {
    const trimmed = value.trim()
    setUsername(trimmed)
    setIsDirty(true)

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)

    if (trimmed === "") {
      setUsernameStatus("idle")
      return
    }
    if (trimmed === initialUsername.current) {
      setUsernameStatus("unchanged")
      return
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus("invalid")
      return
    }

    setUsernameStatus("checking")
    usernameDebounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_username_available", {
        p_username: trimmed,
        p_user_id:  userProfile.id,
      })
      if (error) {
        setUsernameStatus("idle")
        return
      }
      setUsernameStatus(data === true ? "available" : "taken")
    }, 500)
  }

  // cleanup debounce on unmount
  useEffect(() => {
    return () => { if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current) }
  }, [])


  // ── Warn on unsaved changes ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])


  // ── Load institutes ───────────────────────────────────────────────────────

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("institute_profiles")
        .select("profile_id, institute_name, courses")
        .order("institute_name")
      if (data) {
        setInstitutes(data)
        if (initialData?.institute_id) {
          const found = data.find((i) => i.profile_id === initialData.institute_id)
          if (found) {
            setInstituteName(found.institute_name)
            setAvailableCourses(found.courses ?? [])
          }
        }
      }
    })()
  }, [])

  useEffect(() => {
    const found = institutes.find((i) => i.profile_id === instituteId)
    if (found) {
      setAvailableCourses(found.courses ?? [])
      if (!found.courses?.includes(courseName)) setCourseName("")
    }
  }, [instituteId])


  // ── Avatar upload ─────────────────────────────────────────────────────────

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WEBP image.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image must be smaller than 2 MB.")
      return
    }

    const blobUrl = URL.createObjectURL(file)
    setAvatarSrc(blobUrl)
    setIsUploadingAvatar(true)

    try {
      const oldPath = storedImagePath.current
      if (oldPath) {
        const { error: deleteError } = await supabase.storage.from("avatars").remove([oldPath])
        if (deleteError) console.warn("Could not delete old avatar:", deleteError.message)
      }

      const ext = file.name.split(".").pop() ?? "jpg"
      const timestamp = Date.now()
      const newPath = `candidates/${userProfile.id}/profile/${timestamp}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newPath, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from("candidate_profiles")
        .upsert(
          { profile_id: userProfile.id, profile_image_path: newPath },
          { onConflict: "profile_id" }
        )
      if (dbError) throw dbError

      storedImagePath.current = newPath
      const newPublicUrl = getStorageUrl(supabase, "avatars", newPath)!
      setAvatarSrc(`${newPublicUrl}?v=${timestamp}`)
      URL.revokeObjectURL(blobUrl)
      toast.success("Profile picture updated!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload profile picture. Please try again.")
      setAvatarSrc(getStorageUrl(supabase, "avatars", storedImagePath.current))
      URL.revokeObjectURL(blobUrl)
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }


  // ── Institute select ──────────────────────────────────────────────────────

  function handleInstituteSelect(name: string | null) {
    if (!name) {
      setInstituteId(""); setInstituteName(""); setAvailableCourses([]); setIsDirty(true)
      return
    }
    const found = institutes.find((i) => i.institute_name === name)
    if (found) {
      setInstituteId(found.profile_id)
      setInstituteName(found.institute_name)
      setAvailableCourses(found.courses ?? [])
      setIsDirty(true)
    }
  }


  // ── SGPA ──────────────────────────────────────────────────────────────────

  function handleSgpaChange(index: number, value: string) {
    handleSgpaValues((prev) => { const u = [...prev]; u[index] = value; return u })
  }


  // ── Portfolio links ───────────────────────────────────────────────────────

  function addPortfolioLink() { handlePortfolioLinks((prev) => [...prev, ""]) }
  function handlePortfolioLinkChange(index: number, value: string) {
    handlePortfolioLinks((prev) => { const u = [...prev]; u[index] = value; return u })
  }
  function removePortfolioLink(index: number) {
    handlePortfolioLinks((prev) => prev.filter((_, i) => i !== index))
  }


  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}

    // Username
    if (username && !USERNAME_REGEX.test(username))
      e.username = "3–20 characters: letters, numbers, and underscores only."
    if (usernameStatus === "taken")
      e.username = "This username is already taken."
    if (usernameStatus === "checking")
      e.username = "Please wait for username availability check to complete."

    if (!firstName.trim())     e.firstName     = "First name is required"
    if (!lastName.trim())      e.lastName      = "Last name is required"
    if (!gender)               e.gender        = "Gender is required"
    if (!phoneNumber.trim())   e.phoneNumber   = "Contact number is required"
    else if (!/^[0-9]{10}$/.test(phoneNumber)) e.phoneNumber = "Must be exactly 10 digits"
    if (!dateOfBirth)          e.dateOfBirth   = "Date of birth is required"
    if (!instituteId)          e.institute     = "Institution is required"
    if (!courseName)           e.courseName    = "Course / branch is required"
    if (!passoutYear)          e.passoutYear   = "Passout year is required"
    if (!sscPercentage)        e.sscPercentage = "SSC percentage is required"
    if (!sscPassYear)          e.sscPassYear   = "SSC passing year is required"
    if (!universityPrn.trim()) e.universityPrn = "University PRN is required"
    if (selectedSkills.length === 0) e.skills  = "Select at least one skill"
    if (aadhaarNumber && !/^[0-9]{12}$/.test(aadhaarNumber))
      e.aadhaarNumber = "Aadhaar must be exactly 12 digits"
    return e
  }


  // ── Discard ───────────────────────────────────────────────────────────────

  function handleDiscard() {
    setUsername(userProfile.username ?? "")
    setUsernameStatus("idle")
    setFirstName(initialData?.first_name ?? "")
    setMiddleName(initialData?.middle_name ?? "")
    setLastName(initialData?.last_name ?? "")
    setGender(initialData?.gender ? (GENDER_REVERSE[initialData.gender] ?? "") : "")
    setPhoneNumber(initialData?.phone_number ?? "")
    setDateOfBirth(initialData?.date_of_birth ? parseLocalDate(initialData.date_of_birth) : undefined)
    setAadhaarNumber(initialData?.aadhaar_number ?? "")
    setCurrentAddress(initialData?.current_address ?? "")
    setPermanentAddress(initialData?.permanent_address ?? "")
    setInstituteId(initialData?.institute_id ?? "")
    setCourseName(initialData?.course_name ?? "")
    setPassoutYear(initialData?.passout_year ? String(initialData.passout_year) : "")
    setSscPercentage(initialData?.ssc_percentage != null ? String(initialData.ssc_percentage) : "")
    setSscPassYear(initialData?.ssc_pass_year ? String(initialData.ssc_pass_year) : "")
    setIsHsc(initialData?.is_hsc ?? false)
    setHscPercentage(initialData?.hsc_percentage != null ? String(initialData.hsc_percentage) : "")
    setHscPassYear(initialData?.hsc_pass_year ? String(initialData.hsc_pass_year) : "")
    setIsDiploma(initialData?.is_diploma ?? false)
    setDiplomaPercentage(initialData?.diploma_percentage != null ? String(initialData.diploma_percentage) : "")
    setDiplomaPassYear(initialData?.diploma_pass_year ? String(initialData.diploma_pass_year) : "")
    setUniversityPrn(initialData?.university_prn ?? "")
    setSgpaValues(Array.from({ length: 8 }, (_, i) => {
      const val = initialData?.[`sgpa_sem${i + 1}`]
      return val != null ? String(val) : ""
    }))
    setSelectedSkills(initialData?.skills ?? [])
    setLinkedinUrl(initialData?.linkedin_url ?? "")
    setGithubUrl(initialData?.github_url ?? "")
    setPortfolioLinks(initialData?.portfolio_links?.length ? initialData.portfolio_links : [""])
    setErrors({})
    setIsDirty(false)
    toast.info("Changes discarded.")
  }


  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    startTransition(async () => {
      // ── 1. Update username on profiles table (if changed) ────────────────
      const trimmedUsername = username.trim() || null
      if (trimmedUsername !== (userProfile.username ?? null)) {
        const { error: usernameError } = await supabase
          .from("profiles")
          .update({ username: trimmedUsername })
          .eq("id", userProfile.id)

        if (usernameError) {
          console.error(usernameError)
          // Postgres unique violation
          if (usernameError.code === "23505") {
            setErrors((prev) => ({ ...prev, username: "This username is already taken." }))
            setUsernameStatus("taken")
          } else {
            toast.error("Failed to update username. Please try again.")
          }
          return
        }
      }

      // ── 2. Upsert candidate profile ──────────────────────────────────────
      const isFirstSave = !initialData?.profile_updated
      const payload = {
        profile_id:         userProfile.id,
        first_name:         firstName.trim() || null,
        middle_name:        middleName.trim() || null,
        last_name:          lastName.trim() || null,
        gender:             GENDER_MAP[gender] ?? null,
        phone_number:       phoneNumber.trim() || null,
        date_of_birth:      dateOfBirth ? toLocalDateString(dateOfBirth) : null,
        aadhaar_number:     aadhaarNumber.trim() || null,
        current_address:    currentAddress.trim() || null,
        permanent_address:  permanentAddress.trim() || null,
        institute_id:       instituteId || null,
        course_name:        courseName || null,
        passout_year:       passoutYear ? Number(passoutYear) : null,
        ssc_percentage:     sscPercentage ? Number(sscPercentage) : null,
        ssc_pass_year:      sscPassYear ? Number(sscPassYear) : null,
        is_hsc:             isHsc,
        hsc_percentage:     isHsc && hscPercentage ? Number(hscPercentage) : null,
        hsc_pass_year:      isHsc && hscPassYear ? Number(hscPassYear) : null,
        is_diploma:         isDiploma,
        diploma_percentage: isDiploma && diplomaPercentage ? Number(diplomaPercentage) : null,
        diploma_pass_year:  isDiploma && diplomaPassYear ? Number(diplomaPassYear) : null,
        university_prn:     universityPrn.trim() || null,
        sgpa_sem1:          sgpaValues[0] ? Number(sgpaValues[0]) : null,
        sgpa_sem2:          sgpaValues[1] ? Number(sgpaValues[1]) : null,
        sgpa_sem3:          sgpaValues[2] ? Number(sgpaValues[2]) : null,
        sgpa_sem4:          sgpaValues[3] ? Number(sgpaValues[3]) : null,
        sgpa_sem5:          sgpaValues[4] ? Number(sgpaValues[4]) : null,
        sgpa_sem6:          sgpaValues[5] ? Number(sgpaValues[5]) : null,
        sgpa_sem7:          sgpaValues[6] ? Number(sgpaValues[6]) : null,
        sgpa_sem8:          sgpaValues[7] ? Number(sgpaValues[7]) : null,
        skills:             selectedSkills.length > 0 ? selectedSkills : null,
        linkedin_url:       linkedinUrl.trim() || null,
        github_url:         githubUrl.trim() || null,
        portfolio_links:    portfolioLinks.filter((l) => l.trim()),
        ...(isFirstSave ? { profile_updated: true } : {}),
      }

      const { error } = await supabase
        .from("candidate_profiles")
        .upsert(payload, { onConflict: "profile_id" })

      if (error) {
        console.error(error)
        toast.error("Failed to save profile. Please try again.")
      } else {
        toast.success("Profile saved successfully!")
        setIsDirty(false)
        // Keep username status as unchanged after a successful save
        if (trimmedUsername) {
          initialUsername.current = trimmedUsername
          setUsernameStatus("unchanged")
        }
      }
    })
  }


  // ── Render ────────────────────────────────────────────────────────────────

  const instituteNames = institutes.map((i) => i.institute_name)
  const usernameMsg    = usernameStatusMessage(usernameStatus)

  return (
    <div className="min-h-screen w-full">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and account preferences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto px-4 pt-5 md:px-8">
          <TabsList className="inline-flex h-9 gap-0.5 rounded-lg bg-muted p-1">
            {TABS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-md px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-4 py-6 md:px-8 md:py-8">

          {/* ════════════════════════════════════════════════════════════════
              ACCOUNT TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="account" className="space-y-6 mt-0">

            {/* ── Account Settings (Username) ── */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Your unique username is used to identify you on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="your_username"
                      className={cn(
                        "pl-9 pr-9",
                        !!initialUsername.current && "cursor-not-allowed opacity-60",
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      value={username}
                      maxLength={20}
                      readOnly={!!initialUsername.current}
                      disabled={!!initialUsername.current}
                      onChange={(e) => handleUsernameChange(e.target.value.replace(/\s/g, ""))}
                      autoComplete="username"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {initialUsername.current
                        ? null
                        : <UsernameStatusIcon status={usernameStatus} />
                      }
                    </span>
                  </div>
                  {initialUsername.current
                    ? <p className="text-xs text-muted-foreground">Username cannot be changed once set.</p>
                    : errors.username
                      ? <FieldError message={errors.username} />
                      : usernameMsg && (
                          <p className={cn("text-xs", usernameMsg.className)}>{usernameMsg.text}</p>
                        )
                  }
                  {!initialUsername.current && (
                    <p className="text-xs text-muted-foreground">
                      3–20 characters · letters, numbers, and underscores only · cannot be changed after saving
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Profile Photo ── */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>JPEG, PNG or WEBP · max 2 MB · square recommended</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarSrc ?? undefined} alt="Profile picture" className="object-cover" />
                      <AvatarFallback className="text-xl font-semibold">
                        {getInitials(firstName, lastName, userProfile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      aria-label="Change profile picture"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isUploadingAvatar
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Camera className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                      {isUploadingAvatar
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                        : <><Upload className="h-4 w-4 mr-2" />Upload Photo</>}
                    </Button>
                    <p className="text-xs text-muted-foreground">Square image recommended · max 2 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Personal Details ── */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Your basic personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name<RequiredMark /></Label>
                    <Input placeholder="First name" value={firstName} onChange={(e) => handleFirstName(e.target.value)} />
                    <FieldError message={errors.firstName} />
                  </div>
                  <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input placeholder="Middle name" value={middleName} onChange={(e) => handleMiddleName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name<RequiredMark /></Label>
                    <Input placeholder="Last name" value={lastName} onChange={(e) => handleLastName(e.target.value)} />
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gender<RequiredMark /></Label>
                    <Combobox items={GENDER_OPTIONS} value={gender} onValueChange={(v) => handleGender(v || "")}>
                      <ComboboxInput placeholder="Select gender" />
                      <ComboboxContent>
                        <ComboboxEmpty>No gender found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.gender} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number<RequiredMark /></Label>
                    <Input
                      placeholder="10-digit mobile number"
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => handlePhoneNumber(e.target.value.replace(/\D/g, ""))}
                    />
                    <FieldError message={errors.phoneNumber} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth<RequiredMark /></Label>
                    <Popover open={dobOpen} onOpenChange={setDobOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start font-normal", !dateOfBirth && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateOfBirth ? formatDate(dateOfBirth) : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          defaultMonth={dateOfBirth ?? defaultDobDate}
                          captionLayout="dropdown"
                          fromYear={1950}
                          toYear={2010}
                          onSelect={(date) => { handleDateOfBirth(date); setDobOpen(false) }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldError message={errors.dateOfBirth} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Aadhaar Number</Label>
                  <Input
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => handleAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                  />
                  <FieldError message={errors.aadhaarNumber} />
                </div>

                <div className="space-y-2">
                  <Label>Current Address</Label>
                  <Textarea
                    placeholder="Current address"
                    rows={3}
                    value={currentAddress}
                    onChange={(e) => handleCurrentAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permanent Address</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handlePermanentAddress(currentAddress)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Same as current
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Permanent address"
                    rows={3}
                    value={permanentAddress}
                    onChange={(e) => handlePermanentAddress(e.target.value)}
                  />
                </div>

              </CardContent>
            </Card>

            {/* ── Education Details ── */}
            <Card>
              <CardHeader>
                <CardTitle>Education Details</CardTitle>
                <CardDescription>Your academic background and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label>Institution<RequiredMark /></Label>
                  <Combobox items={instituteNames} value={instituteName} onValueChange={handleInstituteSelect}>
                    <ComboboxInput placeholder="Search institution..." />
                    <ComboboxContent>
                      <ComboboxEmpty>No institution found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError message={errors.institute} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Branch / Course<RequiredMark /></Label>
                    <Combobox
                      items={availableCourses}
                      value={courseName}
                      onValueChange={(v) => handleCourseName(v || "")}
                    >
                      <ComboboxInput
                        placeholder={
                          !instituteId ? "Select institution first"
                          : availableCourses.length ? "Select course"
                          : "No courses available"
                        }
                        disabled={!instituteId}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No course found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.courseName} />
                  </div>
                  <div className="space-y-2">
                    <Label>Passout Year<RequiredMark /></Label>
                    <Input
                      placeholder="e.g. 2026"
                      type="number"
                      min="2020"
                      max="2035"
                      value={passoutYear}
                      onChange={(e) => handlePassoutYear(e.target.value)}
                    />
                    <FieldError message={errors.passoutYear} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SSC Percentage<RequiredMark /></Label>
                    <Input
                      placeholder="e.g. 85.60"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={sscPercentage}
                      onChange={(e) => handleSscPercentage(e.target.value)}
                    />
                    <FieldError message={errors.sscPercentage} />
                  </div>
                  <div className="space-y-2">
                    <Label>SSC Passing Year<RequiredMark /></Label>
                    <Combobox items={YEAR_OPTIONS} value={sscPassYear} onValueChange={(v) => handleSscPassYear(v || "")}>
                      <ComboboxInput placeholder="Select year" />
                      <ComboboxContent>
                        <ComboboxEmpty>No year found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.sscPassYear} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Education After SSC</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHsc}
                        onChange={(e) => handleIsHsc(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">HSC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDiploma}
                        onChange={(e) => handleIsDiploma(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">Diploma</span>
                    </label>
                  </div>

                  {isHsc && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>HSC Percentage</Label>
                        <Input placeholder="e.g. 78.40" type="number" step="0.01" max="100" value={hscPercentage} onChange={(e) => handleHscPercentage(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>HSC Passing Year</Label>
                        <Combobox items={YEAR_OPTIONS} value={hscPassYear} onValueChange={(v) => handleHscPassYear(v || "")}>
                          <ComboboxInput placeholder="Select year" />
                          <ComboboxContent>
                            <ComboboxEmpty>No year found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                    </div>
                  )}

                  {isDiploma && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>Diploma Percentage</Label>
                        <Input placeholder="e.g. 72.00" type="number" step="0.01" max="100" value={diplomaPercentage} onChange={(e) => handleDiplomaPercentage(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Diploma Passing Year</Label>
                        <Combobox items={YEAR_OPTIONS} value={diplomaPassYear} onValueChange={(v) => handleDiplomaPassYear(v || "")}>
                          <ComboboxInput placeholder="Select year" />
                          <ComboboxContent>
                            <ComboboxEmpty>No year found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>University PRN<RequiredMark /></Label>
                  <Input
                    placeholder="Enter university PRN"
                    value={universityPrn}
                    onChange={(e) => handleUniversityPrn(e.target.value)}
                  />
                  <FieldError message={errors.universityPrn} />
                </div>

                <div className="space-y-3">
                  <Label>Engineering SGPA (Semester-wise)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sem {i + 1}</Label>
                        <Input
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sgpaValues[i]}
                          onChange={(e) => handleSgpaChange(i, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ── Professional Information ── */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your skills and professional links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label>Resume</Label>
                  <Input type="file" accept=".pdf,.doc,.docx" disabled />
                  <p className="text-xs text-muted-foreground">Resume upload coming soon · PDF, DOC, DOCX · max 5 MB</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Skills<RequiredMark /></Label>
                  <Combobox
                    multiple
                    autoHighlight
                    items={SOFTWARE_SKILLS}
                    value={selectedSkills}
                    onValueChange={(values) => handleSelectedSkills(values as string[])}
                  >
                    <ComboboxChips ref={skillsAnchor} className="w-full">
                      <ComboboxValue>
                        {(values) => (
                          <>
                            {values.map((value: string) => (
                              <ComboboxChip key={value}>{value}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder="Search and select skills..." />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={skillsAnchor}>
                      <ComboboxEmpty>No skill found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError message={errors.skills} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input
                      placeholder="https://linkedin.com/in/yourprofile"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => handleLinkedinUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input
                      placeholder="https://github.com/yourusername"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => handleGithubUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Portfolio / Other Links</Label>
                  {portfolioLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={link}
                        onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                        placeholder="https://yourportfolio.com"
                        type="url"
                      />
                      <Button variant="ghost" size="icon" type="button" onClick={() => removePortfolioLink(index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPortfolioLink} type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add link
                  </Button>
                </div>

              </CardContent>
            </Card>

          </TabsContent>


          {/* ════════════════════════════════════════════════════════════════
              SECURITY TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="security" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button disabled>Update Password (coming soon)</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Require a verification code when signing in</p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ════════════════════════════════════════════════════════════════
              BILLING TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="billing" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Subscription and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Current Plan: <strong>Free</strong></p>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ════════════════════════════════════════════════════════════════
              NOTIFICATIONS TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Email Alerts",          desc: "Receive important notifications via email" },
                  { label: "Job Updates",            desc: "Get notified about new job opportunities" },
                  { label: "Group Notifications",    desc: "Updates from groups and communities you joined" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>


          {/* ════════════════════════════════════════════════════════════════
              LOGIN HISTORY TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="history" className="mt-0">
            <LoginHistoryTab
              supabase={supabase}
              cardDescription="Recent access to your account"
            />
          </TabsContent>


          {/* ════════════════════════════════════════════════════════════════
              PRIVACY TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="privacy" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>Manage your data privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Public Profile",                   desc: "Make your profile visible to recruiters" },
                  { label: "Resume Visible to Recruiters",     desc: "Allow recruiters to view and download your resume" },
                  { label: "Allow Data Usage",                 desc: "Help improve platform with usage data" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or delete your account data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline">Export All Data</Button>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  Request Account Deletion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>

      <FloatingSaveBar
        isDirty={isDirty}
        isPending={isPending}
        onSave={handleSave}
        onDiscard={handleDiscard}
        message="You have unsaved changes"
      />
    </div>
  )
}