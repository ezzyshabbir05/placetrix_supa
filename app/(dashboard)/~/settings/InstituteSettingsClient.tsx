"use client"

// app/~/settings/InstituteSettingsClient.tsx

import { useState, useTransition, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/supabase/profile"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput,
  ComboboxItem, ComboboxList,
} from "@/components/ui/combobox"
import { FloatingSaveBar } from "@/components/ui/floating-save-bar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Upload, Plus, Minus, Mail, Globe, Phone, Loader2, Camera,
  CheckCircle2, XCircle, AtSign, Monitor, Smartphone, Tablet,
  RefreshCw, LogOut, MapPin, Clock, ShieldAlert, CalendarClock,
  Eye, EyeOff, KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const AFFILIATION_OPTIONS = [
  "SPPU - Savitribai Phule Pune University",
  "Mumbai University",
  "AICTE - All India Council for Technical Education",
  "UGC - University Grants Commission",
  "Autonomous",
  "Other",
]

const STATE_OPTIONS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

const COUNTRY_OPTIONS = ["India", "Other"]
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

// ─── Types ────────────────────────────────────────────────────────────────────

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged"

interface Props {
  userProfile: UserProfile
  initialData: Record<string, any> | null
}

interface SessionEntry {
  id: string
  created_at: string | null
  updated_at: string | null
  not_after: string | null
  ip: unknown
  user_agent: string | null
}

interface ParsedUA {
  browser: string
  os: string
  device: "desktop" | "mobile" | "tablet"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
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

function parseUserAgent(ua: string | null): ParsedUA {
  if (!ua) return { browser: "Unknown Browser", os: "Unknown OS", device: "desktop" }
  let browser = "Unknown Browser", os = "Unknown OS"
  let device: "desktop" | "mobile" | "tablet" = "desktop"

  if (ua.includes("Edg/") || ua.includes("EdgA/") || ua.includes("Edge/")) browser = "Edge"
  else if (ua.includes("SamsungBrowser/")) browser = "Samsung Browser"
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera"
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/")) browser = "Chrome"
  else if (ua.includes("Firefox/") || ua.includes("FxiOS/")) browser = "Firefox"
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari"
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browser = "Internet Explorer"

  if (ua.includes("iPhone")) { os = "iOS"; device = "mobile" }
  else if (ua.includes("iPad")) { os = "iPadOS"; device = "tablet" }
  else if (ua.includes("Android")) { os = "Android"; device = ua.includes("Mobile") ? "mobile" : "tablet" }
  else if (ua.includes("Windows NT")) os = "Windows"
  else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS"
  else if (ua.includes("CrOS")) os = "ChromeOS"
  else if (ua.includes("Linux")) os = "Linux"

  return { browser, os, device }
}

function getSessionIdFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.session_id ?? null
  } catch {
    return null
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Unknown"
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffSecs < 60) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatExpiry(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (date < new Date()) return null
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function isExpired(not_after: string | null): boolean {
  return !!not_after && new Date(not_after) < new Date()
}

// ─── Password Strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  const labels = ["", "Weak", "Fair", "Good", "Strong"]
  const colors = ["", "text-destructive", "text-amber-500", "text-yellow-500 dark:text-yellow-400", "text-emerald-600 dark:text-emerald-400"]
  return { score: clamped, label: labels[clamped], color: colors[clamped] }
}

function PasswordStrengthBar({ score }: { score: 0 | 1 | 2 | 3 | 4 }) {
  if (score === 0) return null
  const segColors: Record<number, string> = {
    1: "bg-destructive", 2: "bg-amber-500", 3: "bg-yellow-500", 4: "bg-emerald-500",
  }
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-200",
            s <= score ? segColors[score] : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "institution" | "security" | "notifications" | "history" | "privacy"

const TABS: { value: Tab; label: string }[] = [
  { value: "institution", label: "Institution" },
  { value: "security", label: "Security" },
  { value: "notifications", label: "Notifications" },
  { value: "history", label: "Login History" },
  { value: "privacy", label: "Privacy" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsernameStatusIcon({ status }: { status: UsernameStatus }) {
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  if (status === "available") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "taken" || status === "invalid") return <XCircle className="h-4 w-4 text-destructive" />
  return null
}

function usernameStatusMessage(status: UsernameStatus): { text: string; className: string } | null {
  if (status === "checking") return { text: "Checking availability…", className: "text-muted-foreground" }
  if (status === "available") return { text: "Username is available!", className: "text-emerald-600 dark:text-emerald-400" }
  if (status === "taken") return { text: "Username is already taken.", className: "text-destructive" }
  if (status === "invalid") return { text: "3–20 characters: letters, numbers, underscores only.", className: "text-destructive" }
  if (status === "unchanged") return { text: "This is your current username.", className: "text-muted-foreground" }
  return null
}

function DeviceIcon({ device }: { device: "desktop" | "mobile" | "tablet" }) {
  const cls = "h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
  if (device === "mobile") return <Smartphone className={cls} />
  if (device === "tablet") return <Tablet className={cls} />
  return <Monitor className={cls} />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InstituteSettingsClient({ userProfile, initialData }: Props) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isPwPending, startPwTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("institution")

  // ── Username ──────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(userProfile.username ?? "")
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle")
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialUsername = useRef(userProfile.username ?? "")

  // ── Logo ──────────────────────────────────────────────────────────────────
  const storedLogoPath = useRef<string | null>(initialData?.logo_path ?? null)
  const [logoSrc, setLogoSrc] = useState<string | null>(() =>
    getStorageUrl(supabase, "avatars", storedLogoPath.current)
  )
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Institute fields ──────────────────────────────────────────────────────
  const [instituteName, setInstituteName] = useState(initialData?.institute_name ?? "")
  const [instituteCode, setInstituteCode] = useState(initialData?.institute_code ?? "")
  const [establishedYear, setEstablishedYear] = useState(
    initialData?.established_year ? String(initialData.established_year) : ""
  )
  const [affiliation, setAffiliation] = useState(initialData?.affiliation ?? "")
  const [address, setAddress] = useState(initialData?.address ?? "")
  const [city, setCity] = useState(initialData?.city ?? "")
  const [stateVal, setStateVal] = useState(initialData?.state ?? "")
  const [pincode, setPincode] = useState(initialData?.pincode ?? "")
  const [country, setCountry] = useState(initialData?.country ?? "India")
  const [instPhone, setInstPhone] = useState(initialData?.phone_number ?? "")
  const [instEmail, setInstEmail] = useState(initialData?.email ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "")
  const [principalName, setPrincipalName] = useState(initialData?.principal_name ?? "")
  const [principalEmail, setPrincipalEmail] = useState(initialData?.principal_email ?? "")
  const [principalPhone, setPrincipalPhone] = useState(initialData?.principal_phone ?? "")
  const [courses, setCourses] = useState<string[]>(
    initialData?.courses?.length ? initialData.courses : [""]
  )
  const [socialLinks, setSocialLinks] = useState<string[]>(
    initialData?.social_links?.length ? initialData.social_links : [""]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Login History ─────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [sessionsLoading, setSessLoading] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  // ── Password state ────────────────────────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [pwShowCurrent, setPwShowCurrent] = useState(false)
  const [pwShowNew, setPwShowNew] = useState(false)
  const [pwShowConfirm, setPwShowConfirm] = useState(false)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSuccess, setPwSuccess] = useState(false)

  const pwStrength = getPasswordStrength(pwNew)
  const pwConfirmMatch = pwConfirm.length > 0 && pwConfirm === pwNew
  const pwConfirmMismatch = pwConfirm.length > 0 && pwConfirm !== pwNew

  // ── Dirty tracking ────────────────────────────────────────────────────────

  const markDirty = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T | ((prev: T) => T)) => {
        setter(value as any)
        setIsDirty(true)
      },
    []
  )

  const handleInstituteName = markDirty(setInstituteName)
  const handleInstituteCode = markDirty(setInstituteCode)
  const handleEstablishedYear = markDirty(setEstablishedYear)
  const handleAffiliation = markDirty(setAffiliation)
  const handleAddress = markDirty(setAddress)
  const handleCity = markDirty(setCity)
  const handleStateVal = markDirty(setStateVal)
  const handlePincode = markDirty(setPincode)
  const handleCountry = markDirty(setCountry)
  const handleInstPhone = markDirty(setInstPhone)
  const handleInstEmail = markDirty(setInstEmail)
  const handleWebsiteUrl = markDirty(setWebsiteUrl)
  const handlePrincipalName = markDirty(setPrincipalName)
  const handlePrincipalEmail = markDirty(setPrincipalEmail)
  const handlePrincipalPhone = markDirty(setPrincipalPhone)
  const handleCourses = markDirty(setCourses)
  const handleSocialLinks = markDirty(setSocialLinks)

  // ── Username debounce ─────────────────────────────────────────────────────

  function handleUsernameChange(value: string) {
    const trimmed = value.trim()
    setUsername(trimmed)
    setIsDirty(true)
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)
    if (!trimmed) { setUsernameStatus("idle"); return }
    if (trimmed === initialUsername.current) { setUsernameStatus("unchanged"); return }
    if (!USERNAME_REGEX.test(trimmed)) { setUsernameStatus("invalid"); return }
    setUsernameStatus("checking")
    usernameDebounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_username_available", {
        p_username: trimmed,
        p_user_id: userProfile.id,
      })
      if (error) { setUsernameStatus("idle"); return }
      setUsernameStatus(data === true ? "available" : "taken")
    }, 500)
  }

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

  // ── Logo upload ───────────────────────────────────────────────────────────

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setLogoSrc(blobUrl)
    setIsUploadingLogo(true)
    try {
      const oldPath = storedLogoPath.current
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
      }
      const ext = file.name.split(".").pop() ?? "jpg"
      const timestamp = Date.now()
      const newPath = `institutes/${userProfile.id}/logo/${timestamp}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newPath, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase
        .from("institute_profiles")
        .update({ logo_path: newPath })
        .eq("profile_id", userProfile.id);
      if (dbError) throw dbError
      storedLogoPath.current = newPath
      const newPublicUrl = getStorageUrl(supabase, "avatars", newPath)
      setLogoSrc(`${newPublicUrl}?v=${timestamp}`)
      URL.revokeObjectURL(blobUrl)
      toast.success("Logo updated!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload logo. Please try again.")
      setLogoSrc(getStorageUrl(supabase, "avatars", storedLogoPath.current))
      URL.revokeObjectURL(blobUrl)
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  // ── Course management ─────────────────────────────────────────────────────

  function addCourse() { handleCourses((prev) => [...prev, ""]) }

  function handleCourseChange(index: number, value: string) {
    handleCourses((prev) => { const u = [...prev]; u[index] = value; return u })
  }

  function removeCourse(index: number) {
    handleCourses((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Social links ──────────────────────────────────────────────────────────

  function addSocialLink() { handleSocialLinks((prev) => [...prev, ""]) }

  function handleSocialLinkChange(index: number, value: string) {
    handleSocialLinks((prev) => { const u = [...prev]; u[index] = value; return u })
  }

  function removeSocialLink(index: number) {
    handleSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Login History ─────────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    setSessLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSessions([]); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) setCurrentSessionId(getSessionIdFromJwt(session.access_token))
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, created_at, updated_at, not_after, ip, user_agent")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
      if (error) throw error
      setSessions(data ?? [])
    } catch {
      toast.error("Failed to load login history.")
    } finally {
      setSessLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadSessions() }, [loadSessions])

  async function handleRevokeSession(sessionId: string) {
    setRevokingId(sessionId)
    try {
      const { error } = await supabase.rpc("revoke_session", { p_session_id: sessionId })
      if (error) throw error
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      toast.success("Session revoked.")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to revoke session.")
    } finally {
      setRevokingId(null)
    }
  }

  async function handleRevokeAllSessions() {
    const others = sessions.filter((s) => s.id !== currentSessionId)
    if (!others.length) { toast.info("No other active sessions."); return }
    setRevokingAll(true)
    let ok = 0, fail = 0
    for (const s of others) {
      try {
        const { error } = await supabase.rpc("revoke_session", { p_session_id: s.id })
        if (error) throw error
        ok++
        setSessions((prev) => prev.filter((x) => x.id !== s.id))
      } catch { fail++ }
    }
    setRevokingAll(false)
    fail === 0
      ? toast.success(`${ok} session${ok !== 1 ? "s" : ""} revoked.`)
      : toast.warning(`${ok} revoked, ${fail} failed.`)
  }

  const otherSessionCount = sessions.filter((s) => s.id !== currentSessionId).length

  // ── Password handlers ─────────────────────────────────────────────────────

  function clearPwError(key: string) {
    setPwErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validatePassword(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!pwCurrent) e.current = "Current password is required."
    if (!pwNew) e.new = "New password is required."
    else if (pwNew.length < 8) e.new = "Password must be at least 8 characters."
    else if (pwStrength.score < 2) e.new = "Password is too weak — add uppercase letters, numbers, or symbols."
    else if (pwCurrent && pwNew === pwCurrent) e.new = "New password must be different from your current password."
    if (!pwConfirm) e.confirm = "Please confirm your new password."
    else if (pwConfirm !== pwNew) e.confirm = "Passwords do not match."
    return e
  }

  function handlePasswordSubmit() {
    const errs = validatePassword()
    setPwErrors(errs)
    if (Object.keys(errs).length > 0) return

    startPwTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: pwCurrent,
      })
      if (signInError) {
        setPwErrors({ current: "Current password is incorrect." })
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: pwNew })
      if (updateError) {
        const msg = updateError.message ?? ""
        if (msg.toLowerCase().includes("same") || msg.toLowerCase().includes("different")) {
          setPwErrors({ new: "New password must be different from your current password." })
        } else if (msg.toLowerCase().includes("weak")) {
          setPwErrors({ new: "Password does not meet security requirements." })
        } else {
          toast.error("Failed to update password. Please try again.")
        }
        return
      }

      toast.success("Password updated successfully!")
      setPwSuccess(true)
      setPwCurrent(""); setPwNew(""); setPwConfirm("")
      setPwErrors({})
    })
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (username && !USERNAME_REGEX.test(username))
      e.username = "3–20 characters: letters, numbers, and underscores only."
    if (usernameStatus === "taken") e.username = "This username is already taken."
    if (usernameStatus === "checking") e.username = "Please wait for username availability check."
    if (!instituteName.trim()) e.instituteName = "College name is required."
    if (!affiliation) e.affiliation = "Affiliation is required."
    if (!address.trim()) e.address = "Address is required."
    if (!city.trim()) e.city = "City is required."
    if (!stateVal) e.state = "State is required."
    if (!pincode.trim()) e.pincode = "Pincode is required."
    else if (!/^[0-9]{6}$/.test(pincode)) e.pincode = "Must be exactly 6 digits."
    if (!country) e.country = "Country is required."
    if (!instPhone.trim()) e.instPhone = "Contact number is required."
    if (!instEmail.trim()) e.instEmail = "Email address is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(instEmail)) e.instEmail = "Enter a valid email address."
    if (!principalName.trim()) e.principalName = "Principal name is required."
    if (!principalEmail.trim()) e.principalEmail = "Principal email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(principalEmail)) e.principalEmail = "Enter a valid email address."
    if (!principalPhone.trim()) e.principalPhone = "Principal phone is required."
    return e
  }

  // ── Discard ───────────────────────────────────────────────────────────────

  function handleDiscard() {
    setUsername(userProfile.username ?? "")
    setUsernameStatus("idle")
    setInstituteName(initialData?.institute_name ?? "")
    setInstituteCode(initialData?.institute_code ?? "")
    setEstablishedYear(initialData?.established_year ? String(initialData.established_year) : "")
    setAffiliation(initialData?.affiliation ?? "")
    setAddress(initialData?.address ?? "")
    setCity(initialData?.city ?? "")
    setStateVal(initialData?.state ?? "")
    setPincode(initialData?.pincode ?? "")
    setCountry(initialData?.country ?? "India")
    setInstPhone(initialData?.phone_number ?? "")
    setInstEmail(initialData?.email ?? "")
    setWebsiteUrl(initialData?.website_url ?? "")
    setPrincipalName(initialData?.principal_name ?? "")
    setPrincipalEmail(initialData?.principal_email ?? "")
    setPrincipalPhone(initialData?.principal_phone ?? "")
    setCourses(initialData?.courses?.length ? initialData.courses : [""])
    setSocialLinks(initialData?.social_links?.length ? initialData.social_links : [""])
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
      const trimmedUsername = username.trim() || null

      // 1. Update main `profiles` table (username only)
      if (trimmedUsername !== (userProfile.username ?? null)) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username: trimmedUsername })
          .eq("id", userProfile.id)

        if (profileError) {
          if (profileError.code === "23505") {
            setErrors((prev) => ({ ...prev, username: "This username is already taken." }))
            setUsernameStatus("taken")
          } else {
            toast.error("Failed to update account settings. Please try again.")
          }
          return
        }
      }

      // 2. Prepare payload for `institute_profiles`
      const payload = {
        profile_id: userProfile.id,
        institute_name: instituteName.trim() || null,
        institute_code: instituteCode.trim() || null,
        established_year: establishedYear ? Number(establishedYear) : null,
        affiliation: affiliation || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: stateVal || null,
        pincode: pincode.trim() || null,
        country: country || null,
        phone_number: instPhone.trim() || null,
        email: instEmail.trim() || null,
        website_url: websiteUrl.trim() || null,
        principal_name: principalName.trim() || null,
        principal_email: principalEmail.trim() || null,
        principal_phone: principalPhone.trim() || null,
        courses: courses.filter((c) => c.trim()),
        social_links: socialLinks.filter((l) => l.trim()),
        profile_updated: true,
      }

      // 3. Save Institute Profile (Bypass ON CONFLICT errors)
      const { error } = initialData
        ? await supabase.from("institute_profiles").update(payload).eq("profile_id", userProfile.id)
        : await supabase.from("institute_profiles").insert(payload)

      if (error) {
        console.error("Supabase Save Error:", error)
        toast.error(error.message || "Failed to save profile. Please try again.")
      } else {
        toast.success("Profile saved successfully!")
        setIsDirty(false)
        if (trimmedUsername) {
          initialUsername.current = trimmedUsername
          setUsernameStatus("unchanged")
        }
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const usernameMsg = usernameStatusMessage(usernameStatus)

  return (
    <div className="min-h-screen w-full">

      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your institution profile and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>

        {/* Tab Bar */}
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

          {/* ══════════════════════════════════════════════════════════
              INSTITUTION TAB
          ══════════════════════════════════════════════════════════ */}
          <TabsContent value="institution" className="space-y-6 mt-0">

            {/* Account Settings (Username) */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Your unique username identifies your institution on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="your_institution"
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
                      {initialUsername.current ? null : <UsernameStatusIcon status={usernameStatus} />}
                    </span>
                  </div>
                  {initialUsername.current ? (
                    <p className="text-xs text-muted-foreground">Username cannot be changed once set.</p>
                  ) : errors.username ? (
                    <FieldError message={errors.username} />
                  ) : usernameMsg ? (
                    <p className={cn("text-xs", usernameMsg.className)}>{usernameMsg.text}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      3–20 characters · letters, numbers, and underscores only · cannot be changed after saving
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle>College Logo</CardTitle>
                <CardDescription>JPEG, PNG or WEBP · max 2 MB · square recommended</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={logoSrc ?? undefined} alt="Institution logo" className="object-cover" />
                      <AvatarFallback className="text-xl font-semibold">
                        {instituteName ? instituteName[0].toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      aria-label="Change institution logo"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isUploadingLogo
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Camera className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                      {isUploadingLogo
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                        : <><Upload className="h-4 w-4 mr-2" />Upload Logo</>}
                    </Button>
                    <p className="text-xs text-muted-foreground">Square image recommended · max 2 MB</p>
                    {!initialData?.institute_name && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Save institution details first, then upload the logo.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about your institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>College Name<RequiredMark /></Label>
                    <Input
                      placeholder="Enter college name"
                      value={instituteName}
                      onChange={(e) => handleInstituteName(e.target.value)}
                    />
                    <FieldError message={errors.instituteName} />
                  </div>
                  <div className="space-y-2">
                    <Label>College Code</Label>
                    <Input
                      placeholder="College code (optional)"
                      value={instituteCode}
                      onChange={(e) => handleInstituteCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Established Year</Label>
                    <Input
                      placeholder="e.g. 1990"
                      type="number"
                      min={1800}
                      max={2026}
                      value={establishedYear}
                      onChange={(e) => handleEstablishedYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliation<RequiredMark /></Label>
                    <Combobox items={AFFILIATION_OPTIONS} value={affiliation} onValueChange={(v) => handleAffiliation(v || "")}>
                      <ComboboxInput placeholder="Select affiliation" />
                      <ComboboxContent>
                        <ComboboxEmpty>No affiliation found.</ComboboxEmpty>
                        <ComboboxList>
                          {AFFILIATION_OPTIONS.map((item) => (
                            <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.affiliation} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Address<RequiredMark /></Label>
                  <Textarea
                    placeholder="Complete address"
                    rows={3}
                    value={address}
                    onChange={(e) => handleAddress(e.target.value)}
                  />
                  <FieldError message={errors.address} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City<RequiredMark /></Label>
                    <Input placeholder="City" value={city} onChange={(e) => handleCity(e.target.value)} />
                    <FieldError message={errors.city} />
                  </div>
                  <div className="space-y-2">
                    <Label>State<RequiredMark /></Label>
                    <Combobox items={STATE_OPTIONS} value={stateVal} onValueChange={(v) => handleStateVal(v || "")}>
                      <ComboboxInput placeholder="Select state" />
                      <ComboboxContent>
                        <ComboboxEmpty>No state found.</ComboboxEmpty>
                        <ComboboxList>
                          {STATE_OPTIONS.map((item) => (
                            <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.state} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode<RequiredMark /></Label>
                    <Input
                      placeholder="6-digit pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => handlePincode(e.target.value.replace(/\D/g, ""))}
                    />
                    <FieldError message={errors.pincode} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Country<RequiredMark /></Label>
                  <Combobox items={COUNTRY_OPTIONS} value={country} onValueChange={(v) => handleCountry(v || "India")}>
                    <ComboboxInput placeholder="Select country" />
                    <ComboboxContent>
                      <ComboboxEmpty>No country found.</ComboboxEmpty>
                      <ComboboxList>
                        {COUNTRY_OPTIONS.map((item) => (
                          <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError message={errors.country} />
                </div>

              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Primary contact details for the institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Contact Number<RequiredMark />
                    </Label>
                    <Input
                      placeholder="Institution contact number"
                      type="tel"
                      value={instPhone}
                      onChange={(e) => handleInstPhone(e.target.value)}
                    />
                    <FieldError message={errors.instPhone} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Address<RequiredMark />
                    </Label>
                    <Input
                      placeholder="college@example.com"
                      type="email"
                      value={instEmail}
                      onChange={(e) => handleInstEmail(e.target.value)}
                    />
                    <FieldError message={errors.instEmail} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Website URL
                  </Label>
                  <Input
                    placeholder="https://www.yourcollege.edu"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => handleWebsiteUrl(e.target.value)}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Administrative Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Administrative Contacts</CardTitle>
                <CardDescription>Key personnel contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium">Principal Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name<RequiredMark /></Label>
                    <Input
                      placeholder="Principal name"
                      value={principalName}
                      onChange={(e) => handlePrincipalName(e.target.value)}
                    />
                    <FieldError message={errors.principalName} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email<RequiredMark /></Label>
                    <Input
                      placeholder="principal@example.com"
                      type="email"
                      value={principalEmail}
                      onChange={(e) => handlePrincipalEmail(e.target.value)}
                    />
                    <FieldError message={errors.principalEmail} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number<RequiredMark /></Label>
                    <Input
                      placeholder="Contact number"
                      type="tel"
                      value={principalPhone}
                      onChange={(e) => handlePrincipalPhone(e.target.value)}
                    />
                    <FieldError message={errors.principalPhone} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courses Offered */}
            <Card>
              <CardHeader>
                <CardTitle>Courses Offered</CardTitle>
                <CardDescription>Departments / courses available at your institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {courses.map((course, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. Computer Science"
                      value={course}
                      onChange={(e) => handleCourseChange(index, e.target.value)}
                    />
                    {courses.length > 1 && (
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeCourse(index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCourse} type="button">
                  <Plus className="h-4 w-4 mr-2" />Add course
                </Button>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media &amp; Links</CardTitle>
                <CardDescription>Connect your institution's social presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link}
                      onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                      placeholder="https://facebook.com/yourcollegepage"
                      type="url"
                    />
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeSocialLink(index)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSocialLink} type="button">
                  <Plus className="h-4 w-4 mr-2" />Add link
                </Button>
              </CardContent>
            </Card>

          </TabsContent>

          {/* ══════════════════════════════════════════════════════════
              SECURITY TAB
          ══════════════════════════════════════════════════════════ */}
          <TabsContent value="security" className="space-y-6 mt-0">

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your college account secure with a strong password</CardDescription>
              </CardHeader>
              <CardContent>
                {pwSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Password updated successfully</p>
                      <p className="text-xs text-muted-foreground">Your new password is active on all devices.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPwSuccess(false)}>
                      Change Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-sm">

                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="inst-pw-current">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="inst-pw-current"
                          type={pwShowCurrent ? "text" : "password"}
                          placeholder="Enter your current password"
                          value={pwCurrent}
                          autoComplete="current-password"
                          disabled={isPwPending}
                          className={cn("pr-10", pwErrors.current && "border-destructive focus-visible:ring-destructive")}
                          onChange={(e) => { setPwCurrent(e.target.value); clearPwError("current") }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setPwShowCurrent((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {pwShowCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pwErrors.current && <p className="text-xs text-destructive">{pwErrors.current}</p>}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="inst-pw-new">New Password</Label>
                      <div className="relative">
                        <Input
                          id="inst-pw-new"
                          type={pwShowNew ? "text" : "password"}
                          placeholder="Enter a strong new password"
                          value={pwNew}
                          autoComplete="new-password"
                          disabled={isPwPending}
                          className={cn("pr-10", pwErrors.new && "border-destructive focus-visible:ring-destructive")}
                          onChange={(e) => { setPwNew(e.target.value); clearPwError("new") }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setPwShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {pwShowNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pwNew ? (
                        <>
                          <PasswordStrengthBar score={pwStrength.score} />
                          <p className={cn("text-xs", pwStrength.color)}>{pwStrength.label}</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Min. 8 characters · Uppercase, lowercase, numbers &amp; symbols recommended
                        </p>
                      )}
                      {pwErrors.new && <p className="text-xs text-destructive">{pwErrors.new}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="inst-pw-confirm">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="inst-pw-confirm"
                          type={pwShowConfirm ? "text" : "password"}
                          placeholder="Re-enter your new password"
                          value={pwConfirm}
                          autoComplete="new-password"
                          disabled={isPwPending}
                          className={cn(
                            "pr-10",
                            pwConfirmMatch && "border-emerald-500 focus-visible:ring-emerald-500",
                            (pwConfirmMismatch && !pwErrors.confirm) && "border-destructive focus-visible:ring-destructive",
                            pwErrors.confirm && "border-destructive focus-visible:ring-destructive"
                          )}
                          onChange={(e) => { setPwConfirm(e.target.value); clearPwError("confirm") }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setPwShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {pwShowConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pwConfirmMatch && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Passwords match ✓</p>
                      )}
                      {pwConfirmMismatch && !pwErrors.confirm && (
                        <p className="text-xs text-destructive">Passwords do not match.</p>
                      )}
                      {pwErrors.confirm && <p className="text-xs text-destructive">{pwErrors.confirm}</p>}
                    </div>

                    <Button onClick={handlePasswordSubmit} disabled={isPwPending} className="gap-2">
                      {isPwPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Updating Password…</>
                        : <><KeyRound className="h-4 w-4" />Update Password</>}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
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

          {/* ══════════════════════════════════════════════════════════
              NOTIFICATIONS TAB
          ══════════════════════════════════════════════════════════ */}
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Student Registration Alerts", desc: "Get notified when new students register" },
                  { label: "Placement Updates", desc: "Notifications about placement activities" },
                  { label: "System Announcements", desc: "Important system updates and changes" },
                  { label: "Weekly Reports", desc: "Receive weekly summary of activities" },
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

          {/* ══════════════════════════════════════════════════════════
              LOGIN HISTORY TAB
          ══════════════════════════════════════════════════════════ */}
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Devices currently signed in to your account</CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSessions}
                    disabled={sessionsLoading}
                    className="gap-1.5 text-xs h-8"
                  >
                    {sessionsLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />}
                    Refresh
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Revoke-All Banner */}
                {!sessionsLoading && otherSessionCount > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-medium text-destructive">
                        {otherSessionCount} other active session{otherSessionCount !== 1 ? "s" : ""} detected
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={revokingAll} className="h-7 px-3 text-xs gap-1.5">
                          {revokingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                          Sign out all
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{otherSessionCount} other device{otherSessionCount !== 1 ? "s" : ""}</strong>{" "}
                            will be signed out immediately. Your current session will remain active.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleRevokeAllSessions}
                          >
                            Sign out all
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Skeleton */}
                {sessionsLoading && (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3.5 animate-pulse">
                        <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 rounded bg-muted" />
                          <div className="h-2.5 w-1/2 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!sessionsLoading && sessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No sessions found</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Login activity will appear here once detected.</p>
                  </div>
                )}

                {/* Session Cards */}
                {!sessionsLoading && sessions.length > 0 && (
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const { browser, os, device } = parseUserAgent(session.user_agent)
                      const isCurrent = session.id === currentSessionId
                      const expired = isExpired(session.not_after)
                      const expiryLabel = formatExpiry(session.not_after)
                      const isRevoking = revokingId === session.id

                      return (
                        <div
                          key={session.id}
                          className={cn(
                            "group flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors",
                            isCurrent && "border-primary/30 bg-primary/5",
                            expired && !isCurrent && "opacity-50"
                          )}
                        >
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                            isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <DeviceIcon device={device} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-medium leading-none truncate">{browser} on {os}</span>
                              {isCurrent && (
                                <Badge className="h-4 px-1.5 text-[10px] rounded-sm bg-primary/15 text-primary border-0 font-medium">
                                  This device
                                </Badge>
                              )}
                              {expired && (
                                <Badge className="h-4 px-1.5 text-[10px] rounded-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0 font-medium">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                              {session.ip != null && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5" />{String(session.ip)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />Signed in {formatTimeAgo(session.created_at)}
                              </span>
                              {session.updated_at && session.updated_at !== session.created_at && (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="h-2.5 w-2.5" />Last active {formatTimeAgo(session.updated_at)}
                                </span>
                              )}
                              {expiryLabel && (
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="h-2.5 w-2.5" />Expires {expiryLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {!isCurrent && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isRevoking || revokingAll}
                                  className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                >
                                  {isRevoking
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <LogOut className="h-3.5 w-3.5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sign out this device?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{browser} on {os}</strong>
                                    {session.ip != null ? ` (IP: ${String(session.ip)})` : ""} will be signed out immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleRevokeSession(session.id)}
                                  >
                                    Sign out
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════
              PRIVACY TAB
          ══════════════════════════════════════════════════════════ */}
          <TabsContent value="privacy" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>Manage your institution's data privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Public Profile", desc: "Make college info visible to recruiters" },
                  { label: "Student Data Sharing", desc: "Allow sharing student data with verified recruiters" },
                  { label: "Analytics & Insights", desc: "Help improve platform with usage data" },
                  { label: "Placement Statistics", desc: "Share placement statistics publicly" },
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
                <CardDescription>Export or delete your institution data</CardDescription>
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
