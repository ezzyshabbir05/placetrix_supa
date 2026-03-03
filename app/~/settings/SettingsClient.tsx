"use client"

import { useState, useEffect, useTransition } from "react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"
import {
  User,
  Lock,
  CreditCard,
  Bell,
  History,
  Shield,
  Upload,
  Plus,
  Minus,
  Copy,
  CalendarIcon,
  Building2,
  Users,
  Mail,
  Globe,
  Phone,
  Loader2,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

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

const BATCH_OPTIONS = Array.from({ length: 10 }, (_, i) => String(2024 + i))
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2025 - i))

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstituteOption {
  profile_id: string
  institute_name: string
  courses: string[] | null
}

interface Props {
  role: "candidate" | "institute"
  userProfile: UserProfile
  initialData: Record<string, any> | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RequiredMark() {
  return <span className="text-red-500 ml-1">*</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsClient({ role, userProfile, initialData }: Props) {
  const isCandidate = role === "candidate"
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // ── Candidate State ──────────────────────────────────────────────────────

  const [firstName, setFirstName] = useState(initialData?.first_name ?? "")
  const [middleName, setMiddleName] = useState(initialData?.middle_name ?? "")
  const [lastName, setLastName] = useState(initialData?.last_name ?? "")
  const [gender, setGender] = useState(
    initialData?.gender ? GENDER_REVERSE[initialData.gender] ?? "" : ""
  )
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number ?? "")
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    initialData?.date_of_birth ? new Date(initialData.date_of_birth) : undefined
  )
  const [dobOpen, setDobOpen] = useState(false)
  const [aadhaarNumber, setAadhaarNumber] = useState(initialData?.aadhaar_number ?? "")
  const [currentAddress, setCurrentAddress] = useState(initialData?.current_address ?? "")
  const [permanentAddress, setPermanentAddress] = useState(initialData?.permanent_address ?? "")

  // Education
  const [instituteId, setInstituteId] = useState<string>(initialData?.institute_id ?? "")
  const [instituteName, setInstituteName] = useState("")
  const [courseName, setCourseName] = useState(initialData?.course_name ?? "")
  const [passoutYear, setPassoutYear] = useState(
    initialData?.passout_year ? String(initialData.passout_year) : ""
  )
  const [sscPercentage, setSscPercentage] = useState(
    initialData?.ssc_percentage != null ? String(initialData.ssc_percentage) : ""
  )
  const [sscPassYear, setSscPassYear] = useState(
    initialData?.ssc_pass_year ? String(initialData.ssc_pass_year) : ""
  )
  const [isHsc, setIsHsc] = useState(initialData?.is_hsc ?? false)
  const [hscPercentage, setHscPercentage] = useState(
    initialData?.hsc_percentage != null ? String(initialData.hsc_percentage) : ""
  )
  const [hscPassYear, setHscPassYear] = useState(
    initialData?.hsc_pass_year ? String(initialData.hsc_pass_year) : ""
  )
  const [isDiploma, setIsDiploma] = useState(initialData?.is_diploma ?? false)
  const [diplomaPercentage, setDiplomaPercentage] = useState(
    initialData?.diploma_percentage != null ? String(initialData.diploma_percentage) : ""
  )
  const [diplomaPassYear, setDiplomaPassYear] = useState(
    initialData?.diploma_pass_year ? String(initialData.diploma_pass_year) : ""
  )
  const [universityPrn, setUniversityPrn] = useState(initialData?.university_prn ?? "")
  const [sgpaValues, setSgpaValues] = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => {
      const val = initialData?.[`sgpa_sem${i + 1}`]
      return val != null ? String(val) : ""
    })
  )

  // Professional
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.skills ?? [])
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url ?? "")
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "")
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(
    initialData?.portfolio_links?.length ? initialData.portfolio_links : [""]
  )

  // Institute lookup
  const [institutes, setInstitutes] = useState<InstituteOption[]>([])
  const [availableCourses, setAvailableCourses] = useState<string[]>([])

  // ── Institute State ──────────────────────────────────────────────────────

  const [institutNameField, setInstitutNameField] = useState(initialData?.institute_name ?? "")
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

  // ── Common State ─────────────────────────────────────────────────────────

  const [errors, setErrors] = useState<Record<string, string>>({})

  const skillsAnchor = useComboboxAnchor()
  const defaultDobDate = new Date(2000, 0, 1)

  // ── Effects ──────────────────────────────────────────────────────────────

  // Load institutes for candidate
  useEffect(() => {
    if (!isCandidate) return
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
  }, [isCandidate])

  // When instituteId changes, update courses
  useEffect(() => {
    const found = institutes.find((i) => i.profile_id === instituteId)
    if (found) {
      setAvailableCourses(found.courses ?? [])
      if (!found.courses?.includes(courseName)) setCourseName("")
    }
  }, [instituteId])

  // ── Candidate Handlers ───────────────────────────────────────────────────

  function handleInstituteSelect(name: string | null) {
    if (!name) {
      setInstituteId("")
      setInstituteName("")
      setAvailableCourses([])
      return
    }
    const found = institutes.find((i) => i.institute_name === name)
    if (found) {
      setInstituteId(found.profile_id)
      setInstituteName(found.institute_name)
      setAvailableCourses(found.courses ?? [])
    }
  }

  function handleSgpaChange(index: number, value: string) {
    const updated = [...sgpaValues]
    updated[index] = value
    setSgpaValues(updated)
  }

  function addPortfolioLink() {
    setPortfolioLinks((prev) => [...prev, ""])
  }

  function handlePortfolioLinkChange(index: number, value: string) {
    const updated = [...portfolioLinks]
    updated[index] = value
    setPortfolioLinks(updated)
  }

  function removePortfolioLink(index: number) {
    setPortfolioLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Institute Handlers ───────────────────────────────────────────────────

  function addCourse() {
    setCourses((prev) => [...prev, ""])
  }

  function handleCourseChange(index: number, value: string) {
    const updated = [...courses]
    updated[index] = value
    setCourses(updated)
  }

  function removeCourse(index: number) {
    setCourses((prev) => prev.filter((_, i) => i !== index))
  }

  function addSocialLink() {
    setSocialLinks((prev) => [...prev, ""])
  }

  function handleSocialLinkChange(index: number, value: string) {
    const updated = [...socialLinks]
    updated[index] = value
    setSocialLinks(updated)
  }

  function removeSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function validateCandidate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = "First name is required"
    if (!lastName.trim()) e.lastName = "Last name is required"
    if (!gender) e.gender = "Gender is required"
    if (!phoneNumber.trim()) e.phoneNumber = "Contact number is required"
    else if (!/^[0-9]{10}$/.test(phoneNumber)) e.phoneNumber = "Must be exactly 10 digits"
    if (!dateOfBirth) e.dateOfBirth = "Date of birth is required"
    if (!instituteId) e.institute = "Institution is required"
    if (!courseName) e.courseName = "Course / branch is required"
    if (!passoutYear) e.passoutYear = "Passout year is required"
    if (!sscPercentage) e.sscPercentage = "SSC percentage is required"
    if (!sscPassYear) e.sscPassYear = "SSC passing year is required"
    if (!universityPrn.trim()) e.universityPrn = "University PRN is required"
    if (selectedSkills.length === 0) e.skills = "Select at least one skill"
    if (aadhaarNumber && !/^[0-9]{12}$/.test(aadhaarNumber))
      e.aadhaarNumber = "Aadhaar must be exactly 12 digits"
    return e
  }

  function validateInstitute(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!institutNameField.trim()) e.instituteName = "College name is required"
    if (!affiliation) e.affiliation = "Affiliation is required"
    if (!address.trim()) e.address = "Address is required"
    if (!city.trim()) e.city = "City is required"
    if (!stateVal) e.state = "State is required"
    if (!pincode.trim()) e.pincode = "Pincode is required"
    if (!country) e.country = "Country is required"
    if (!instPhone.trim()) e.instPhone = "Contact number is required"
    if (!instEmail.trim()) e.instEmail = "Email is required"
    if (!principalName.trim()) e.principalName = "Principal name is required"
    if (!principalEmail.trim()) e.principalEmail = "Principal email is required"
    if (!principalPhone.trim()) e.principalPhone = "Principal contact is required"
    return e
  }

  // ── Save Handlers ─────────────────────────────────────────────────────────

  function handleSaveCandidate() {
    const newErrors = validateCandidate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    startTransition(async () => {
      const isFirstSave = !initialData?.profile_updated

      const payload: Record<string, any> = {
        profile_id: userProfile.id,
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        gender: GENDER_MAP[gender] ?? null,
        phone_number: phoneNumber.trim() || null,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : null,
        aadhaar_number: aadhaarNumber.trim() || null,
        current_address: currentAddress.trim() || null,
        permanent_address: permanentAddress.trim() || null,
        institute_id: instituteId || null,
        course_name: courseName || null,
        passout_year: passoutYear ? Number(passoutYear) : null,
        ssc_percentage: sscPercentage ? Number(sscPercentage) : null,
        ssc_pass_year: sscPassYear ? Number(sscPassYear) : null,
        is_hsc: isHsc,
        hsc_percentage: isHsc && hscPercentage ? Number(hscPercentage) : null,
        hsc_pass_year: isHsc && hscPassYear ? Number(hscPassYear) : null,
        is_diploma: isDiploma,
        diploma_percentage: isDiploma && diplomaPercentage ? Number(diplomaPercentage) : null,
        diploma_pass_year: isDiploma && diplomaPassYear ? Number(diplomaPassYear) : null,
        university_prn: universityPrn.trim() || null,
        sgpa_sem1: sgpaValues[0] ? Number(sgpaValues[0]) : null,
        sgpa_sem2: sgpaValues[1] ? Number(sgpaValues[1]) : null,
        sgpa_sem3: sgpaValues[2] ? Number(sgpaValues[2]) : null,
        sgpa_sem4: sgpaValues[3] ? Number(sgpaValues[3]) : null,
        sgpa_sem5: sgpaValues[4] ? Number(sgpaValues[4]) : null,
        sgpa_sem6: sgpaValues[5] ? Number(sgpaValues[5]) : null,
        sgpa_sem7: sgpaValues[6] ? Number(sgpaValues[6]) : null,
        sgpa_sem8: sgpaValues[7] ? Number(sgpaValues[7]) : null,
        skills: selectedSkills.length > 0 ? selectedSkills : null,
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        portfolio_links: portfolioLinks.filter((l) => l.trim()),
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
      }
    })
  }

  function handleSaveInstitute() {
    const newErrors = validateInstitute()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    startTransition(async () => {
      const payload: Record<string, any> = {
        profile_id: userProfile.id,
        institute_name: institutNameField.trim(),
        institute_code: instituteCode.trim() || null,
        established_year: establishedYear ? Number(establishedYear) : null,
        affiliation: affiliation || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: stateVal || null,
        pincode: pincode.trim() || null,
        country: country || "India",
        phone_number: instPhone.trim() || null,
        email: instEmail.trim() || null,
        website_url: websiteUrl.trim() || null,
        principal_name: principalName.trim() || null,
        principal_email: principalEmail.trim() || null,
        principal_phone: principalPhone.trim() || null,
        courses: courses.filter((c) => c.trim()),
        social_links: socialLinks.filter((l) => l.trim()),
      }

      const { error } = await supabase
        .from("institute_profiles")
        .upsert(payload, { onConflict: "profile_id" })

      if (error) {
        console.error(error)
        toast.error("Failed to save institution details. Please try again.")
      } else {
        toast.success("Institution details saved successfully!")
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const instituteNames = institutes.map((i) => i.institute_name)

  return (
    <div className="min-h-screen w-full">
      <Tabs defaultValue={isCandidate ? "account" : "institution"}>
        {/* ── Header ── */}
        <div className="border-b border-border bg-background/95 backdrop-blur">
          <div className="px-4 py-4 md:px-6 md:py-6 space-y-1">
            <h1 className="text-3xl font-bold">
              {isCandidate ? "Settings" : "College Settings"}
            </h1>
            <p className="text-muted-foreground">
              {isCandidate
                ? "Manage your account preferences"
                : "Manage your institution preferences and information"}
            </p>
          </div>
          <div className="w-full overflow-x-auto no-scrollbar pb-px">
            <TabsList variant="line" className="px-4 md:px-6 justify-start">
              {isCandidate ? (
                <>
                  <TabsTrigger value="account"><User className="h-4 w-4 mr-2" />Account</TabsTrigger>
                  <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Security</TabsTrigger>
                  <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" />Billing</TabsTrigger>
                  <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
                  <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Login History</TabsTrigger>
                  <TabsTrigger value="privacy"><Shield className="h-4 w-4 mr-2" />Privacy</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="institution"><Building2 className="h-4 w-4 mr-2" />Institution</TabsTrigger>
                  <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Security</TabsTrigger>
                  <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
                  <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Login History</TabsTrigger>
                  <TabsTrigger value="privacy"><Shield className="h-4 w-4 mr-2" />Privacy</TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
        </div>

        <div className="px-4 py-6 md:px-6 md:py-8">

          {/* ══════════════════════════════════════════════════════════════
              CANDIDATE — ACCOUNT TAB
          ══════════════════════════════════════════════════════════════ */}
          {isCandidate && (
            <>
              <TabsContent value="account" className="space-y-6">

                {/* Profile Photo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                    <CardDescription>Upload your profile picture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Photo upload coming soon.
                    </p>
                  </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Your basic personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>First Name<RequiredMark /></Label>
                        <Input
                          placeholder="Enter first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <FieldError message={errors.firstName} />
                      </div>
                      <div className="space-y-2">
                        <Label>Middle Name</Label>
                        <Input
                          placeholder="Enter middle name"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name<RequiredMark /></Label>
                        <Input
                          placeholder="Enter last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                        <FieldError message={errors.lastName} />
                      </div>
                    </div>

                    {/* Personal Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Gender<RequiredMark /></Label>
                        <Combobox
                          items={GENDER_OPTIONS}
                          value={gender}
                          onValueChange={(v) => setGender(v || "")}
                        >
                          <ComboboxInput placeholder="Select gender" />
                          <ComboboxContent>
                            <ComboboxEmpty>No gender found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                              )}
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
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        />
                        <FieldError message={errors.phoneNumber} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth<RequiredMark /></Label>
                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start font-normal",
                                !dateOfBirth && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateOfBirth ? dateOfBirth.toLocaleDateString() : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateOfBirth}
                              defaultMonth={dateOfBirth || defaultDobDate}
                              captionLayout="dropdown"
                              fromYear={1950}
                              toYear={2010}
                              onSelect={(date) => {
                                setDateOfBirth(date)
                                setDobOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FieldError message={errors.dateOfBirth} />
                      </div>
                    </div>

                    {/* Aadhaar */}
                    <div className="space-y-2">
                      <Label>Aadhaar Number</Label>
                      <Input
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                      />
                      <FieldError message={errors.aadhaarNumber} />
                    </div>

                    {/* Current Address */}
                    <div className="space-y-2">
                      <Label>Current Address<RequiredMark /></Label>
                      <Textarea
                        placeholder="Enter current address"
                        value={currentAddress}
                        onChange={(e) => setCurrentAddress(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Permanent Address */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permanent Address<RequiredMark /></Label>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => setPermanentAddress(currentAddress)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Same as current
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Enter permanent address"
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Education Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Education Details</CardTitle>
                    <CardDescription>Your academic background and qualifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Institution */}
                    <div className="space-y-2">
                      <Label>Institution<RequiredMark /></Label>
                      <Combobox
                        items={instituteNames}
                        value={instituteName}
                        onValueChange={handleInstituteSelect}
                      >
                        <ComboboxInput placeholder="Search institution..." />
                        <ComboboxContent>
                          <ComboboxEmpty>No institution found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <FieldError message={errors.institute} />
                    </div>

                    {/* Course and Batch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Branch / Course<RequiredMark /></Label>
                        <Combobox
                          items={availableCourses}
                          value={courseName}
                          onValueChange={(v) => setCourseName(v || "")}
                        >
                          <ComboboxInput
                            placeholder={
                              instituteId
                                ? availableCourses.length
                                  ? "Select course"
                                  : "No courses available"
                                : "Select institution first"
                            }
                            disabled={!instituteId}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No course found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                              )}
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
                          onChange={(e) => setPassoutYear(e.target.value)}
                        />
                        <FieldError message={errors.passoutYear} />
                      </div>
                    </div>

                    {/* SSC */}
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
                          onChange={(e) => setSscPercentage(e.target.value)}
                        />
                        <FieldError message={errors.sscPercentage} />
                      </div>
                      <div className="space-y-2">
                        <Label>SSC Passing Year<RequiredMark /></Label>
                        <Combobox
                          items={YEAR_OPTIONS}
                          value={sscPassYear}
                          onValueChange={(v) => setSscPassYear(v || "")}
                        >
                          <ComboboxInput placeholder="Select year" />
                          <ComboboxContent>
                            <ComboboxEmpty>No year found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError message={errors.sscPassYear} />
                      </div>
                    </div>

                    {/* Education Type After SSC */}
                    <div className="space-y-3">
                      <Label>Education After SSC</Label>
                      <div className="flex gap-6">
                        <label className="flex gap-2 items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isHsc}
                            onChange={(e) => setIsHsc(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span>HSC</span>
                        </label>
                        <label className="flex gap-2 items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isDiploma}
                            onChange={(e) => setIsDiploma(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span>Diploma</span>
                        </label>
                      </div>

                      {isHsc && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          <div className="space-y-2">
                            <Label>HSC Percentage</Label>
                            <Input
                              placeholder="e.g. 78.40"
                              type="number"
                              step="0.01"
                              max="100"
                              value={hscPercentage}
                              onChange={(e) => setHscPercentage(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>HSC Passing Year</Label>
                            <Combobox
                              items={YEAR_OPTIONS}
                              value={hscPassYear}
                              onValueChange={(v) => setHscPassYear(v || "")}
                            >
                              <ComboboxInput placeholder="Select year" />
                              <ComboboxContent>
                                <ComboboxEmpty>No year found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </div>
                        </div>
                      )}

                      {isDiploma && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          <div className="space-y-2">
                            <Label>Diploma Percentage</Label>
                            <Input
                              placeholder="e.g. 72.00"
                              type="number"
                              step="0.01"
                              max="100"
                              value={diplomaPercentage}
                              onChange={(e) => setDiplomaPercentage(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Diploma Passing Year</Label>
                            <Combobox
                              items={YEAR_OPTIONS}
                              value={diplomaPassYear}
                              onValueChange={(v) => setDiplomaPassYear(v || "")}
                            >
                              <ComboboxInput placeholder="Select year" />
                              <ComboboxContent>
                                <ComboboxEmpty>No year found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* University PRN */}
                    <div className="space-y-2">
                      <Label>University PRN<RequiredMark /></Label>
                      <Input
                        placeholder="Enter university PRN"
                        value={universityPrn}
                        onChange={(e) => setUniversityPrn(e.target.value)}
                      />
                      <FieldError message={errors.universityPrn} />
                    </div>

                    {/* SGPA */}
                    <div className="space-y-3">
                      <Label>Engineering SGPA (Semester-wise)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="space-y-2">
                            <Label className="text-xs">Sem {i + 1}</Label>
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

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>Your resume, skills, and professional links</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resume */}
                    <div className="space-y-2">
                      <Label>Resume</Label>
                      <Input type="file" accept=".pdf,.doc,.docx" disabled />
                      <p className="text-xs text-muted-foreground">Resume upload coming soon. (PDF, DOC, DOCX — max 5MB)</p>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Skills<RequiredMark /></Label>
                      <Combobox
                        multiple
                        autoHighlight
                        items={SOFTWARE_SKILLS}
                        value={selectedSkills}
                        onValueChange={(values) => setSelectedSkills(values as string[])}
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
                            {(item) => (
                              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <FieldError message={errors.skills} />
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-2">
                      <Label>LinkedIn Profile URL</Label>
                      <Input
                        placeholder="https://linkedin.com/in/yourprofile"
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </div>

                    {/* GitHub */}
                    <div className="space-y-2">
                      <Label>GitHub Profile URL</Label>
                      <Input
                        placeholder="https://github.com/yourusername"
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>

                    {/* Portfolio Links */}
                    {portfolioLinks.map((link, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1 space-y-2">
                          <Label>Portfolio / Other Link {portfolioLinks.length > 1 ? index + 1 : ""}</Label>
                          <Input
                            value={link}
                            onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                            placeholder="https://yourportfolio.com"
                            type="url"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addPortfolioLink} type="button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add another link
                    </Button>
                  </CardContent>
                </Card>

                {/* Save */}
                <div className="flex justify-end">
                  <Button
                    className="w-full md:w-auto"
                    onClick={handleSaveCandidate}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Profile
                  </Button>
                </div>
              </TabsContent>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              INSTITUTE — INSTITUTION TAB
          ══════════════════════════════════════════════════════════════ */}
          {!isCandidate && (
            <>
              <TabsContent value="institution" className="space-y-6">

                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle>College Logo</CardTitle>
                    <CardDescription>Upload your institution's official logo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Logo upload coming soon. (Square PNG/JPG, min 200×200px)
                    </p>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential details about your institution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>College Name<RequiredMark /></Label>
                        <Input
                          placeholder="Enter college name"
                          value={institutNameField}
                          onChange={(e) => setInstitutNameField(e.target.value)}
                        />
                        <FieldError message={errors.instituteName} />
                      </div>
                      <div className="space-y-2">
                        <Label>College Code</Label>
                        <Input
                          placeholder="Enter college code (optional)"
                          value={instituteCode}
                          onChange={(e) => setInstituteCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Established Year</Label>
                        <Input
                          placeholder="e.g. 1990"
                          type="number"
                          min="1800"
                          max="2026"
                          value={establishedYear}
                          onChange={(e) => setEstablishedYear(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Affiliation<RequiredMark /></Label>
                        <Combobox
                          items={AFFILIATION_OPTIONS}
                          value={affiliation}
                          onValueChange={(v) => setAffiliation(v || "")}
                        >
                          <ComboboxInput placeholder="Select affiliation" />
                          <ComboboxContent>
                            <ComboboxEmpty>No affiliation found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError message={errors.affiliation} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address<RequiredMark /></Label>
                      <Textarea
                        placeholder="Enter complete address"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <FieldError message={errors.address} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City<RequiredMark /></Label>
                        <Input
                          placeholder="Enter city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <FieldError message={errors.city} />
                      </div>
                      <div className="space-y-2">
                        <Label>State<RequiredMark /></Label>
                        <Combobox
                          items={STATE_OPTIONS}
                          value={stateVal}
                          onValueChange={(v) => setStateVal(v || "")}
                        >
                          <ComboboxInput placeholder="Select state" />
                          <ComboboxContent>
                            <ComboboxEmpty>No state found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                              )}
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
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        />
                        <FieldError message={errors.pincode} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Country<RequiredMark /></Label>
                      <Combobox
                        items={COUNTRY_OPTIONS}
                        value={country}
                        onValueChange={(v) => setCountry(v || "India")}
                      >
                        <ComboboxInput placeholder="Select country" />
                        <ComboboxContent>
                          <ComboboxEmpty>No country found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                            )}
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
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label><Phone className="h-4 w-4 inline mr-1" />Contact Number<RequiredMark /></Label>
                        <Input
                          placeholder="Enter contact number"
                          type="tel"
                          value={instPhone}
                          onChange={(e) => setInstPhone(e.target.value)}
                        />
                        <FieldError message={errors.instPhone} />
                      </div>
                      <div className="space-y-2">
                        <Label><Mail className="h-4 w-4 inline mr-1" />Email Address<RequiredMark /></Label>
                        <Input
                          placeholder="college@example.com"
                          type="email"
                          value={instEmail}
                          onChange={(e) => setInstEmail(e.target.value)}
                        />
                        <FieldError message={errors.instEmail} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label><Globe className="h-4 w-4 inline mr-1" />Website URL</Label>
                      <Input
                        placeholder="https://www.yourcollege.edu"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Principal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Administrative Contacts</CardTitle>
                    <CardDescription>Key personnel contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold">Principal Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name<RequiredMark /></Label>
                          <Input
                            placeholder="Principal name"
                            value={principalName}
                            onChange={(e) => setPrincipalName(e.target.value)}
                          />
                          <FieldError message={errors.principalName} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email<RequiredMark /></Label>
                          <Input
                            placeholder="principal@example.com"
                            type="email"
                            value={principalEmail}
                            onChange={(e) => setPrincipalEmail(e.target.value)}
                          />
                          <FieldError message={errors.principalEmail} />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Number<RequiredMark /></Label>
                          <Input
                            placeholder="Contact number"
                            type="tel"
                            value={principalPhone}
                            onChange={(e) => setPrincipalPhone(e.target.value)}
                          />
                          <FieldError message={errors.principalPhone} />
                        </div>
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
                  <CardContent className="space-y-4">
                    {courses.map((course, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1 space-y-2">
                          <Label>Course {index + 1}</Label>
                          <Input
                            placeholder="e.g. Computer Science"
                            value={course}
                            onChange={(e) => handleCourseChange(index, e.target.value)}
                          />
                        </div>
                        {courses.length > 1 && (
                          <Button variant="ghost" size="icon" type="button" onClick={() => removeCourse(index)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addCourse} type="button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add another course
                    </Button>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media &amp; Links</CardTitle>
                    <CardDescription>Connect your institution's social presence</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1 space-y-2">
                          <Label>Social Media / Other Link {index + 1}</Label>
                          <Input
                            value={link}
                            onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                            placeholder="https://facebook.com/yourcollegepage"
                            type="url"
                          />
                        </div>
                        <Button variant="ghost" size="icon" type="button" onClick={() => removeSocialLink(index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addSocialLink} type="button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add another link
                    </Button>
                  </CardContent>
                </Card>

                {/* Save */}
                <div className="flex justify-end">
                  <Button
                    className="w-full md:w-auto"
                    onClick={handleSaveInstitute}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Institution Details
                  </Button>
                </div>
              </TabsContent>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SECURITY TAB — common
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Keep your {isCandidate ? "account" : "college account"} secure
                </CardDescription>
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

            {!isCandidate && (
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Require a verification code when signing in
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              BILLING TAB — candidate only
          ══════════════════════════════════════════════════════════════ */}
          {isCandidate && (
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>Subscription and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Current Plan: <strong>Free</strong>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ══════════════════════════════════════════════════════════════
              NOTIFICATIONS TAB — common
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCandidate ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Email Alerts</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Job Updates</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Group Notifications</Label>
                      <Switch />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Student Registration Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified when new students register</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Placement Updates</Label>
                        <p className="text-sm text-muted-foreground">Notifications about placement activities</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Announcements</Label>
                        <p className="text-sm text-muted-foreground">Important system updates and changes</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly summary of activities</p>
                      </div>
                      <Switch />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              LOGIN HISTORY TAB — common
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>
                  Recent access to your {isCandidate ? "account" : "college account"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCandidate ? (
                  <p className="text-sm text-muted-foreground">Chrome · Windows · Pune · 2 days ago</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Chrome · Windows</p>
                        <p className="text-xs text-muted-foreground">Nashik, Maharashtra · 2 hours ago</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Current</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Firefox · Linux</p>
                        <p className="text-xs text-muted-foreground">Pune, Maharashtra · 1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Safari · macOS</p>
                        <p className="text-xs text-muted-foreground">Mumbai, Maharashtra · 3 days ago</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              PRIVACY TAB — common
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>
                  Manage your {isCandidate ? "data privacy" : "institution's data privacy"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCandidate ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Public Profile</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Resume Visible to Recruiters</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Allow Data Usage</Label>
                      <Switch />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public Profile</Label>
                        <p className="text-sm text-muted-foreground">Make college info visible to recruiters</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Student Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">Allow sharing student data with verified recruiters</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Analytics &amp; Insights</Label>
                        <p className="text-sm text-muted-foreground">Help improve platform with usage data</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Placement Statistics</Label>
                        <p className="text-sm text-muted-foreground">Share placement statistics publicly</p>
                      </div>
                      <Switch />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {!isCandidate && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export or delete your institution data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full md:w-auto">
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full md:w-auto text-destructive hover:text-destructive">
                    Request Account Deletion
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}