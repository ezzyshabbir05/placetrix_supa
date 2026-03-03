"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { FloatingSaveBar } from "@/components/ui/floating-save-bar"
import {
  Building2,
  Lock,
  Bell,
  History,
  Shield,
  Upload,
  Plus,
  Minus,
  Mail,
  Globe,
  Phone,
} from "lucide-react"



// ─── Constants ───────────────────────────────────────────────────────────────



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



interface Props {
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



// ─── Component ───────────────────────────────────────────────────────────────



export function InstituteSettingsClient({ userProfile, initialData }: Props) {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)



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
  const [errors, setErrors] = useState<Record<string, string>>({})



  // ── Dirty tracking helper ────────────────────────────────────────────────



  // Wraps any setter so calling it also marks the form as dirty
  const markDirty = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T | ((prev: T) => T)) => {
        // @ts-ignore – overload union is fine here
        setter(value)
        setIsDirty(true)
      },
    []
  )

  const handleInstituteName    = markDirty(setInstitutNameField)
  const handleInstituteCode    = markDirty(setInstituteCode)
  const handleEstablishedYear  = markDirty(setEstablishedYear)
  const handleAffiliation      = markDirty(setAffiliation)
  const handleAddress          = markDirty(setAddress)
  const handleCity             = markDirty(setCity)
  const handleStateVal         = markDirty(setStateVal)
  const handlePincode          = markDirty(setPincode)
  const handleCountry          = markDirty(setCountry)
  const handleInstPhone        = markDirty(setInstPhone)
  const handleInstEmail        = markDirty(setInstEmail)
  const handleWebsiteUrl       = markDirty(setWebsiteUrl)
  const handlePrincipalName    = markDirty(setPrincipalName)
  const handlePrincipalEmail   = markDirty(setPrincipalEmail)
  const handlePrincipalPhone   = markDirty(setPrincipalPhone)
  const handleCourses          = markDirty(setCourses)
  const handleSocialLinks      = markDirty(setSocialLinks)



  // ── Warn on browser close / refresh when dirty ───────────────────────────



  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])



  // ── Course handlers ──────────────────────────────────────────────────────



  function addCourse() {
    handleCourses((prev) => [...prev, ""])
  }

  function handleCourseChange(index: number, value: string) {
    handleCourses((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  function removeCourse(index: number) {
    handleCourses((prev) => prev.filter((_, i) => i !== index))
  }



  // ── Social link handlers ─────────────────────────────────────────────────



  function addSocialLink() {
    handleSocialLinks((prev) => [...prev, ""])
  }

  function handleSocialLinkChange(index: number, value: string) {
    handleSocialLinks((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  function removeSocialLink(index: number) {
    handleSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }



  // ── Validation ────────────────────────────────────────────────────────────



  function validateInstitute(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!institutNameField.trim()) e.instituteName  = "College name is required"
    if (!affiliation)              e.affiliation    = "Affiliation is required"
    if (!address.trim())           e.address        = "Address is required"
    if (!city.trim())              e.city           = "City is required"
    if (!stateVal)                 e.state          = "State is required"
    if (!pincode.trim())           e.pincode        = "Pincode is required"
    if (!country)                  e.country        = "Country is required"
    if (!instPhone.trim())         e.instPhone      = "Contact number is required"
    if (!instEmail.trim())         e.instEmail      = "Email is required"
    if (!principalName.trim())     e.principalName  = "Principal name is required"
    if (!principalEmail.trim())    e.principalEmail = "Principal email is required"
    if (!principalPhone.trim())    e.principalPhone = "Principal contact is required"
    return e
  }



  // ── Discard ───────────────────────────────────────────────────────────────



  function handleDiscard() {
    setInstitutNameField(initialData?.institute_name ?? "")
    setInstituteCode(initialData?.institute_code ?? "")
    setEstablishedYear(
      initialData?.established_year ? String(initialData.established_year) : ""
    )
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



  function handleSaveInstitute() {
    const newErrors = validateInstitute()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.")
      return
    }

    startTransition(async () => {
      const payload: Record<string, any> = {
        profile_id:      userProfile.id,
        institute_name:  institutNameField.trim(),
        institute_code:  instituteCode.trim() || null,
        established_year: establishedYear ? Number(establishedYear) : null,
        affiliation:     affiliation || null,
        address:         address.trim() || null,
        city:            city.trim() || null,
        state:           stateVal || null,
        pincode:         pincode.trim() || null,
        country:         country || "India",
        phone_number:    instPhone.trim() || null,
        email:           instEmail.trim() || null,
        website_url:     websiteUrl.trim() || null,
        principal_name:  principalName.trim() || null,
        principal_email: principalEmail.trim() || null,
        principal_phone: principalPhone.trim() || null,
        courses:         courses.filter((c) => c.trim()),
        social_links:    socialLinks.filter((l) => l.trim()),
      }

      const { error } = await supabase
        .from("institute_profiles")
        .upsert(payload, { onConflict: "profile_id" })

      if (error) {
        console.error(error)
        toast.error("Failed to save institution details. Please try again.")
      } else {
        toast.success("Institution details saved successfully!")
        setIsDirty(false)  // ← clear dirty flag on success
      }
    })
  }



  // ── Render ────────────────────────────────────────────────────────────────



  return (
    <div className="min-h-screen w-full">
      <Tabs defaultValue="institution">


        {/* ── Tab Bar ── */}
        <div className="w-full overflow-x-auto no-scrollbar pb-px border-b border-border">
          <TabsList variant="line" className="px-4 md:px-6 justify-start">
            <TabsTrigger value="institution"><Building2 className="h-4 w-4 mr-2" />Institution</TabsTrigger>
            <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Security</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Login History</TabsTrigger>
            <TabsTrigger value="privacy"><Shield className="h-4 w-4 mr-2" />Privacy</TabsTrigger>
          </TabsList>
        </div>


        <div className="px-4 py-6 md:px-6 md:py-8">


          {/* ══════════════════════════════════════════════════════════════
              INSTITUTION TAB
          ══════════════════════════════════════════════════════════════ */}
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
                      onChange={(e) => handleInstituteName(e.target.value)}
                    />
                    <FieldError message={errors.instituteName} />
                  </div>
                  <div className="space-y-2">
                    <Label>College Code</Label>
                    <Input
                      placeholder="Enter college code (optional)"
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
                      min="1800"
                      max="2026"
                      value={establishedYear}
                      onChange={(e) => handleEstablishedYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliation<RequiredMark /></Label>
                    <Combobox
                      items={AFFILIATION_OPTIONS}
                      value={affiliation}
                      onValueChange={(v) => handleAffiliation(v || "")}
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
                    onChange={(e) => handleAddress(e.target.value)}
                  />
                  <FieldError message={errors.address} />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City<RequiredMark /></Label>
                    <Input
                      placeholder="Enter city"
                      value={city}
                      onChange={(e) => handleCity(e.target.value)}
                    />
                    <FieldError message={errors.city} />
                  </div>
                  <div className="space-y-2">
                    <Label>State<RequiredMark /></Label>
                    <Combobox
                      items={STATE_OPTIONS}
                      value={stateVal}
                      onValueChange={(v) => handleStateVal(v || "")}
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
                      onChange={(e) => handlePincode(e.target.value.replace(/\D/g, ""))}
                    />
                    <FieldError message={errors.pincode} />
                  </div>
                </div>


                <div className="space-y-2">
                  <Label>Country<RequiredMark /></Label>
                  <Combobox
                    items={COUNTRY_OPTIONS}
                    value={country}
                    onValueChange={(v) => handleCountry(v || "India")}
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
                      onChange={(e) => handleInstPhone(e.target.value)}
                    />
                    <FieldError message={errors.instPhone} />
                  </div>
                  <div className="space-y-2">
                    <Label><Mail className="h-4 w-4 inline mr-1" />Email Address<RequiredMark /></Label>
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
                  <Label><Globe className="h-4 w-4 inline mr-1" />Website URL</Label>
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
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Principal Details</h3>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeCourse(index)}
                      >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeSocialLink(index)}
                    >
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

          </TabsContent>


          {/* ══════════════════════════════════════════════════════════════
              SECURITY TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your college account secure</CardDescription>
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
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Require a verification code when signing in
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ══════════════════════════════════════════════════════════════
              NOTIFICATIONS TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Student Registration Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new students register
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Placement Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about placement activities
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system updates and changes
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary of activities
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* ══════════════════════════════════════════════════════════════
              LOGIN HISTORY TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Recent access to your college account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Chrome · Windows</p>
                    <p className="text-xs text-muted-foreground">Nashik, Maharashtra · 2 hours ago</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">Current</span>
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
              </CardContent>
            </Card>
          </TabsContent>


          {/* ══════════════════════════════════════════════════════════════
              PRIVACY TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>Manage your institution's data privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make college info visible to recruiters
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Student Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing student data with verified recruiters
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics &amp; Insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve platform with usage data
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Placement Statistics</Label>
                    <p className="text-sm text-muted-foreground">
                      Share placement statistics publicly
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
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
          </TabsContent>


        </div>
      </Tabs>


      {/* ── Floating Save Bar ─────────────────────────────────────────────────
           Rendered outside <Tabs> so it persists across all tab switches.
           Only appears when isDirty === true (any institution field changed).
      ──────────────────────────────────────────────────────────────────────── */}
      <FloatingSaveBar
        isDirty={isDirty}
        isPending={isPending}
        onSave={handleSaveInstitute}
        onDiscard={handleDiscard}
        message="You have unsaved changes"
      />

    </div>
  )
}
