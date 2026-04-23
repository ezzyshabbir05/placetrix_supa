"use client"

import { useState, useTransition, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/supabase/profile"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FloatingSaveBar } from "@/components/ui/floating-save-bar"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Upload, Loader2, Camera, CheckCircle2, XCircle, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"

const INDUSTRY_OPTIONS = [
  "Information Technology", "Software Development", "Finance & Banking", "Healthcare",
  "Education", "Manufacturing", "Consulting", "E-Commerce", "Telecommunications",
  "Media & Entertainment", "Real Estate", "Automotive", "Energy & Utilities",
  "Government", "Non-Profit", "Other",
]

const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"]

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

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged"

interface Props {
  userProfile: UserProfile
  initialData: Record<string, any> | null
}

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function getStorageUrl(supabase: ReturnType<typeof createClient>, bucket: string, path: string | null): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

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

export function RecruiterSettingsClient({ userProfile, initialData }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)

  // Username
  const [username, setUsername] = useState(userProfile.username ?? "")
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle")
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialUsername = useRef(userProfile.username ?? "")

  // Logo
  const storedLogoPath = useRef<string | null>(initialData?.company_logo_path ?? null)
  const [logoSrc, setLogoSrc] = useState<string | null>(() =>
    getStorageUrl(supabase, "avatars", storedLogoPath.current)
  )
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Company fields
  const [companyName, setCompanyName] = useState(initialData?.company_name ?? "")
  const [industry, setIndustry] = useState(initialData?.industry ?? "")
  const [companySize, setCompanySize] = useState(initialData?.company_size ?? "")
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.company_website ?? "")
  const [companyDescription, setCompanyDescription] = useState(initialData?.company_description ?? "")
  const [hqCity, setHqCity] = useState(initialData?.headquarters_city ?? "")
  const [hqState, setHqState] = useState(initialData?.headquarters_state ?? "")
  const [hqCountry, setHqCountry] = useState(initialData?.headquarters_country ?? "India")
  const [designation, setDesignation] = useState(initialData?.designation ?? "")
  const [department, setDepartment] = useState(initialData?.department ?? "")
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number ?? "")
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const markDirty = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T | ((prev: T) => T)) => {
        setter(value as any)
        setIsDirty(true)
      },
    []
  )

  const handleCompanyName = markDirty(setCompanyName)
  const handleIndustry = markDirty(setIndustry)
  const handleCompanySize = markDirty(setCompanySize)
  const handleCompanyWebsite = markDirty(setCompanyWebsite)
  const handleCompanyDescription = markDirty(setCompanyDescription)
  const handleHqCity = markDirty(setHqCity)
  const handleHqState = markDirty(setHqState)
  const handleHqCountry = markDirty(setHqCountry)
  const handleDesignation = markDirty(setDesignation)
  const handleDepartment = markDirty(setDepartment)
  const handlePhoneNumber = markDirty(setPhoneNumber)
  const handleLinkedinUrl = markDirty(setLinkedinUrl)

  // Username debounce
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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Logo upload
  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { toast.error("Please upload a JPEG, PNG, or WEBP image."); return }
    if (file.size > MAX_IMAGE_SIZE_BYTES) { toast.error("Image must be smaller than 2 MB."); return }
    const blobUrl = URL.createObjectURL(file)
    setLogoSrc(blobUrl)
    setIsUploadingLogo(true)
    try {
      const oldPath = storedLogoPath.current
      if (oldPath) await supabase.storage.from("avatars").remove([oldPath])
      const ext = file.name.split(".").pop() ?? "jpg"
      const timestamp = Date.now()
      const newPath = `recruiters/${userProfile.id}/logo/${timestamp}.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(newPath, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from("recruiter_profiles").update({ company_logo_path: newPath }).eq("profile_id", userProfile.id)
      if (dbError) throw dbError
      await supabase.from("profiles").update({ avatar_path: newPath }).eq("id", userProfile.id)
      await supabase.auth.updateUser({ data: { avatar_path: newPath } })
      storedLogoPath.current = newPath
      const newPublicUrl = getStorageUrl(supabase, "avatars", newPath)
      setLogoSrc(`${newPublicUrl}?v=${timestamp}`)
      URL.revokeObjectURL(blobUrl)
      toast.success("Logo updated!")
      router.refresh()
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

  // Validation
  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (username && !USERNAME_REGEX.test(username)) e.username = "3–20 characters: letters, numbers, and underscores only."
    if (usernameStatus === "taken") e.username = "This username is already taken."
    if (usernameStatus === "checking") e.username = "Please wait for username availability check."
    if (!companyName.trim()) e.companyName = "Company name is required."
    if (!industry) e.industry = "Industry is required."
    if (!companySize) e.companySize = "Company size is required."
    if (!designation.trim()) e.designation = "Your designation is required."
    if (!phoneNumber.trim()) e.phoneNumber = "Contact number is required."
    return e
  }

  // Discard
  function handleDiscard() {
    setUsername(userProfile.username ?? "")
    setUsernameStatus("idle")
    setCompanyName(initialData?.company_name ?? "")
    setIndustry(initialData?.industry ?? "")
    setCompanySize(initialData?.company_size ?? "")
    setCompanyWebsite(initialData?.company_website ?? "")
    setCompanyDescription(initialData?.company_description ?? "")
    setHqCity(initialData?.headquarters_city ?? "")
    setHqState(initialData?.headquarters_state ?? "")
    setHqCountry(initialData?.headquarters_country ?? "India")
    setDesignation(initialData?.designation ?? "")
    setDepartment(initialData?.department ?? "")
    setPhoneNumber(initialData?.phone_number ?? "")
    setLinkedinUrl(initialData?.linkedin_url ?? "")
    setErrors({})
    setIsDirty(false)
    toast.info("Changes discarded.")
  }

  // Save
  function handleSave() {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    startTransition(async () => {
      const trimmedUsername = username.trim() || null

      if (trimmedUsername !== (userProfile.username ?? null)) {
        const { error: profileError } = await supabase.from("profiles").update({ username: trimmedUsername }).eq("id", userProfile.id)
        if (profileError) {
          if (profileError.code === "23505") {
            setErrors(prev => ({ ...prev, username: "This username is already taken." }))
            setUsernameStatus("taken")
          } else {
            toast.error("Failed to update account settings.")
          }
          return
        }
      }

      const payload = {
        profile_id: userProfile.id,
        company_name: companyName.trim(),
        company_website: companyWebsite.trim() || null,
        industry: industry || null,
        company_size: companySize || null,
        company_description: companyDescription.trim() || null,
        headquarters_city: hqCity.trim() || null,
        headquarters_state: hqState || null,
        headquarters_country: hqCountry || null,
        designation: designation.trim() || null,
        department: department.trim() || null,
        phone_number: phoneNumber.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        profile_updated: true,
      }

      const { error } = initialData
        ? await supabase.from("recruiter_profiles").update(payload).eq("profile_id", userProfile.id)
        : await supabase.from("recruiter_profiles").insert(payload)

      if (error) {
        console.error("Save Error:", error)
        toast.error(error.message || "Failed to save profile.")
      } else {
        const newDisplayName = companyName.trim() || userProfile.display_name
        await supabase.from("profiles").update({ display_name: newDisplayName, username: trimmedUsername }).eq("id", userProfile.id)
        await supabase.auth.updateUser({ data: { display_name: newDisplayName, username: trimmedUsername } })
        toast.success("Profile saved successfully!")
        setIsDirty(false)
        if (trimmedUsername) {
          initialUsername.current = trimmedUsername
          setUsernameStatus("unchanged")
        }
        router.refresh()
      }
    })
  }

  const usernameMsg = usernameStatusMessage(usernameStatus)
  const initials = companyName ? companyName.slice(0, 2).toUpperCase() : userProfile.email[0]?.toUpperCase() ?? "?"

  return (
    <div className="min-h-screen w-full">
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your company profile and recruiter details</p>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Your unique username identifies you on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="your_company"
                  className={cn("pl-9 pr-9", !!initialUsername.current && "cursor-not-allowed opacity-60", errors.username && "border-destructive")}
                  value={username}
                  maxLength={20}
                  readOnly={!!initialUsername.current}
                  disabled={!!initialUsername.current}
                  onChange={(e) => handleUsernameChange(e.target.value.replace(/\s/g, ""))}
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
                <p className="text-xs text-muted-foreground">3–20 characters · letters, numbers, and underscores only</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>JPEG, PNG, or WEBP — max 2 MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 rounded-xl border">
                  <AvatarImage src={logoSrc ?? undefined} alt={companyName || "Logo"} className="object-cover" />
                  <AvatarFallback className="rounded-xl text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                </button>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoFileChange} />
              </div>
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                <Upload className="mr-2 h-4 w-4" />{isUploadingLogo ? "Uploading…" : "Upload Logo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Details about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name<RequiredMark /></Label>
                <Input id="companyName" value={companyName} onChange={(e) => handleCompanyName(e.target.value)} className={errors.companyName ? "border-destructive" : ""} />
                <FieldError message={errors.companyName} />
              </div>
              <div className="space-y-2">
                <Label>Industry<RequiredMark /></Label>
                <Combobox items={INDUSTRY_OPTIONS} value={industry} onValueChange={(v) => handleIndustry(v || "")}>
                  <ComboboxInput placeholder="Select industry" className={errors.industry ? "border-destructive" : ""} />
                  <ComboboxContent>
                    <ComboboxEmpty>No results</ComboboxEmpty>
                    <ComboboxList>
                      {INDUSTRY_OPTIONS.map((o) => <ComboboxItem key={o} value={o}>{o}</ComboboxItem>)}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError message={errors.industry} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Size<RequiredMark /></Label>
                <Combobox items={COMPANY_SIZE_OPTIONS} value={companySize} onValueChange={(v) => handleCompanySize(v || "")}>
                  <ComboboxInput placeholder="Select size" className={errors.companySize ? "border-destructive" : ""} />
                  <ComboboxContent>
                    <ComboboxEmpty>No results</ComboboxEmpty>
                    <ComboboxList>
                      {COMPANY_SIZE_OPTIONS.map((o) => <ComboboxItem key={o} value={o}>{o} employees</ComboboxItem>)}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError message={errors.companySize} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input id="companyWebsite" placeholder="https://example.com" value={companyWebsite} onChange={(e) => handleCompanyWebsite(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Company Description</Label>
              <Textarea id="companyDescription" rows={3} placeholder="Brief description of your company" value={companyDescription} onChange={(e) => handleCompanyDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Headquarters */}
        <Card>
          <CardHeader>
            <CardTitle>Headquarters</CardTitle>
            <CardDescription>Company location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hqCity">City</Label>
                <Input id="hqCity" value={hqCity} onChange={(e) => handleHqCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Combobox items={STATE_OPTIONS} value={hqState} onValueChange={(v) => handleHqState(v || "")}>
                  <ComboboxInput placeholder="Select state" />
                  <ComboboxContent>
                    <ComboboxEmpty>No results</ComboboxEmpty>
                    <ComboboxList>
                      {STATE_OPTIONS.map((o) => <ComboboxItem key={o} value={o}>{o}</ComboboxItem>)}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Combobox items={COUNTRY_OPTIONS} value={hqCountry} onValueChange={(v) => handleHqCountry(v || "India")}>
                  <ComboboxInput placeholder="Select country" />
                  <ComboboxContent>
                    <ComboboxEmpty>No results</ComboboxEmpty>
                    <ComboboxList>
                      {COUNTRY_OPTIONS.map((o) => <ComboboxItem key={o} value={o}>{o}</ComboboxItem>)}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recruiter Details */}
        <Card>
          <CardHeader>
            <CardTitle>Recruiter Details</CardTitle>
            <CardDescription>Your personal details as a recruiter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation<RequiredMark /></Label>
                <Input id="designation" placeholder="e.g. HR Manager" value={designation} onChange={(e) => handleDesignation(e.target.value)} className={errors.designation ? "border-destructive" : ""} />
                <FieldError message={errors.designation} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="e.g. Human Resources" value={department} onChange={(e) => handleDepartment(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Contact Number<RequiredMark /></Label>
                <Input id="phoneNumber" placeholder="10-digit number" value={phoneNumber} onChange={(e) => handlePhoneNumber(e.target.value)} className={errors.phoneNumber ? "border-destructive" : ""} />
                <FieldError message={errors.phoneNumber} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input id="linkedinUrl" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => handleLinkedinUrl(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FloatingSaveBar
        isDirty={isDirty}
        isPending={isPending}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  )
}
