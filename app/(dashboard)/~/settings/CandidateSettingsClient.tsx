"use client";
// app/settings/CandidateSettingsClient.tsx

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/supabase/profile";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput,
  ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem,
  ComboboxList, ComboboxValue, useComboboxAnchor,
} from "@/components/ui/combobox";
import { FloatingSaveBar } from "@/components/ui/floating-save-bar";
import { cn } from "@/lib/utils";
import {
  Upload, Plus, Minus, Copy, CalendarIcon, Loader2, Camera,
  CheckCircle2, XCircle, AtSign, Lock, Clock, Monitor, Smartphone,
  Tablet, RefreshCw, LogOut, MapPin, ShieldAlert, CalendarClock,
  Eye, EyeOff, KeyRound, HelpCircle,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Constants ───────────────────────────────────────────────────────────────

const SOFTWARE_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "Go", "Rust", "PHP", "Ruby",
  "Swift", "Kotlin", "React", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js",
  "Django", "Flask", "Spring Boot", "ASP.NET", "Laravel", "React Native", "Flutter",
  "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Material UI", "SQL", "MySQL",
  "PostgreSQL", "MongoDB", "Redis", "Firebase", "Oracle", "SQLite", "Git", "GitHub",
  "GitLab", "Docker", "Kubernetes", "Jenkins", "CI/CD", "AWS", "Azure", "Google Cloud",
  "Heroku", "Netlify", "Vercel", "REST API", "GraphQL", "Microservices", "Linux",
  "Bash", "PowerShell", "Agile", "Scrum", "Jira", "TensorFlow", "PyTorch",
  "Machine Learning", "Deep Learning", "Data Science", "Pandas", "NumPy",
  "Scikit-learn", "Selenium", "Jest", "Cypress", "JUnit", "Postman", "Figma",
  "Adobe XD", "Photoshop", "UI/UX Design",
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const GENDER_MAP: Record<string, string> = { Male: "M", Female: "F", Other: "O" };
const GENDER_REVERSE: Record<string, string> = { M: "Male", F: "Female", O: "Other" };
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));
const PASSOUT_YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - 5 + i));
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ─── Types ────────────────────────────────────────────────────────────────────

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged";

interface InstituteOption {
  profile_id: string;
  institute_name: string;
  courses: string[] | null;
  affiliation: string | null;
}

interface Props {
  userProfile: UserProfile;
  initialData: Record<string, any> | null;
}

interface SessionEntry {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  not_after: string | null;
  ip: unknown;
  user_agent: string | null;
}

interface ParsedUA {
  browser: string;
  os: string;
  device: "desktop" | "mobile" | "tablet";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

/** Returns a simple confirmation for the selected graduation year, without assuming degree length. */
function getGraduationYearHint(selectedYear: string): string | null {
  if (!selectedYear) return null;
  const gradYear = Number(selectedYear);
  const currentYear = new Date().getFullYear();
  if (gradYear < currentYear) return `You graduated in ${gradYear}`;
  if (gradYear === currentYear) return `Graduating this year (${gradYear})`;
  return `Graduating in ${gradYear} — ${gradYear - currentYear} year${gradYear - currentYear > 1 ? "s" : ""} from now`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

function getStorageUrl(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string | null
): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function parseUserAgent(ua: string | null): ParsedUA {
  if (!ua) return { browser: "Unknown Browser", os: "Unknown OS", device: "desktop" };

  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device: "desktop" | "mobile" | "tablet" = "desktop";

  if (ua.includes("Edg/") || ua.includes("EdgA/") || ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome") && !ua.includes("Chromium")) browser = "Chrome";
  else if (ua.includes("Firefox") || ua.includes("FxiOS")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident")) browser = "Internet Explorer";

  if (ua.includes("iPhone")) { os = "iOS"; device = "mobile"; }
  else if (ua.includes("iPad")) { os = "iPadOS"; device = "tablet"; }
  else if (ua.includes("Android")) { os = "Android"; device = ua.includes("Mobile") ? "mobile" : "tablet"; }
  else if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("CrOS")) os = "ChromeOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os, device };
}

function getSessionIdFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(Math.abs(diffMs) / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatExpiry(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (date < new Date()) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isExpired(not_after: string | null): boolean {
  return !!not_after && new Date(not_after) < new Date();
}

// ─── Password Strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "text-destructive", "text-amber-500", "text-yellow-500 dark:text-yellow-400", "text-emerald-600 dark:text-emerald-400"];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

function PasswordStrengthBar({ score }: { score: 0 | 1 | 2 | 3 | 4 }) {
  if (score === 0) return null;
  const segColors: Record<number, string> = {
    1: "bg-destructive", 2: "bg-amber-500", 3: "bg-yellow-500", 4: "bg-emerald-500",
  };
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
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "account" | "security" | "billing" | "notifications" | "history" | "privacy";

const TABS: { value: Tab; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "security", label: "Security" },
  { value: "billing", label: "Billing" },
  { value: "notifications", label: "Notifications" },
  { value: "history", label: "Login History" },
  { value: "privacy", label: "Privacy" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsernameStatusIcon({ status }: { status: UsernameStatus }) {
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "available") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "taken" || status === "invalid") return <XCircle className="h-4 w-4 text-destructive" />;
  return null;
}

function usernameStatusMessage(status: UsernameStatus): { text: string; className: string } | null {
  if (status === "checking") return { text: "Checking availability…", className: "text-muted-foreground" };
  if (status === "available") return { text: "Username is available!", className: "text-emerald-600 dark:text-emerald-400" };
  if (status === "taken") return { text: "Username is already taken.", className: "text-destructive" };
  if (status === "invalid") return { text: "3–20 characters: letters, numbers, underscores only.", className: "text-destructive" };
  if (status === "unchanged") return { text: "This is your current username.", className: "text-muted-foreground" };
  return null;
}

function DeviceIcon({ device }: { device: "desktop" | "mobile" | "tablet" }) {
  const cls = "h-4 w-4 text-muted-foreground shrink-0 mt-0.5";
  if (device === "mobile") return <Smartphone className={cls} />;
  if (device === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CandidateSettingsClient({ userProfile, initialData }: Props) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [isPwPending, startPwTransition] = useTransition();

  // Dirty
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // Username
  const [username, setUsername] = useState(userProfile.username ?? "");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialUsername = useRef(userProfile.username ?? "");

  // Avatar
  const storedImagePath = useRef<string | null>(initialData?.profile_image_path ?? null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    getStorageUrl(supabase, "avatars", storedImagePath.current)
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Personal
  const [firstName, setFirstName] = useState(initialData?.first_name ?? "");
  const [middleName, setMiddleName] = useState(initialData?.middle_name ?? "");
  const [lastName, setLastName] = useState(initialData?.last_name ?? "");
  const [gender, setGender] = useState(
    initialData?.gender ? GENDER_REVERSE[initialData.gender] ?? "" : ""
  );
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    initialData?.date_of_birth ? parseLocalDate(initialData.date_of_birth) : undefined
  );
  const [dobOpen, setDobOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState(initialData?.aadhaar_number ?? "");
  const [currentAddress, setCurrentAddress] = useState(initialData?.current_address ?? "");
  const [permanentAddress, setPermanentAddress] = useState(initialData?.permanent_address ?? "");

  // Education
  const [instituteId, setInstituteId] = useState<string>(initialData?.institute_id ?? "");
  const [instituteName, setInstituteName] = useState("");
  const [courseName, setCourseName] = useState(initialData?.course_name ?? "");
  const [passoutYear, setPassoutYear] = useState(
    initialData?.passout_year ? String(initialData.passout_year) : ""
  );
  const [sscPercentage, setSscPercentage] = useState(
    initialData?.ssc_percentage != null ? String(initialData.ssc_percentage) : ""
  );
  const [sscPassYear, setSscPassYear] = useState(
    initialData?.ssc_pass_year ? String(initialData.ssc_pass_year) : ""
  );
  const [isHsc, setIsHsc] = useState(initialData?.is_hsc ?? false);
  const [hscPercentage, setHscPercentage] = useState(
    initialData?.hsc_percentage != null ? String(initialData.hsc_percentage) : ""
  );
  const [hscPassYear, setHscPassYear] = useState(
    initialData?.hsc_pass_year ? String(initialData.hsc_pass_year) : ""
  );
  const [isDiploma, setIsDiploma] = useState(initialData?.is_diploma ?? false);
  const [diplomaPercentage, setDiplomaPercentage] = useState(
    initialData?.diploma_percentage != null ? String(initialData.diploma_percentage) : ""
  );
  const [diplomaPassYear, setDiplomaPassYear] = useState(
    initialData?.diploma_pass_year ? String(initialData.diploma_pass_year) : ""
  );
  const [universityPrn, setUniversityPrn] = useState(initialData?.university_prn ?? "");
  const [sgpaValues, setSgpaValues] = useState<string[]>(
    Array.from({ length: 8 }, (_, i) => {
      const val = initialData?.[`sgpa_sem${i + 1}`];
      return val != null ? String(val) : "";
    })
  );

  // Professional
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.skills ?? []);
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(
    initialData?.portfolio_links?.length ? initialData.portfolio_links : [""]
  );

  // Institute lookup
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(null);

  // Login History
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [sessionsLoading, setSessLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // Profile errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Password state ──────────────────────────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSuccess, setPwSuccess] = useState(false);

  const pwStrength = getPasswordStrength(pwNew);
  const pwConfirmMatch = pwConfirm.length > 0 && pwConfirm === pwNew;
  const pwConfirmMismatch = pwConfirm.length > 0 && pwConfirm !== pwNew;

  const skillsAnchor = useComboboxAnchor();
  const defaultDobDate = new Date(2000, 0, 1);

  // ─── Dirty tracking ──────────────────────────────────────────────────────────

  const markDirty = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T | null | ((prev: T) => T)) => {
        (setter as any)(value);
        setIsDirty(true);
      },
    []
  );

  const handleFirstName = markDirty(setFirstName);
  const handleMiddleName = markDirty(setMiddleName);
  const handleLastName = markDirty(setLastName);
  const handleGender = markDirty(setGender);
  const handlePhoneNumber = markDirty(setPhoneNumber);
  const handleDateOfBirth = markDirty(setDateOfBirth);
  const handleAadhaarNumber = markDirty(setAadhaarNumber);
  const handleCurrentAddress = markDirty(setCurrentAddress);
  const handlePermanentAddress = markDirty(setPermanentAddress);
  const handleCourseName = markDirty(setCourseName);
  const handlePassoutYear = markDirty(setPassoutYear);
  const handleSscPercentage = markDirty(setSscPercentage);
  const handleSscPassYear = markDirty(setSscPassYear);
  const handleIsHsc = markDirty(setIsHsc);
  const handleHscPercentage = markDirty(setHscPercentage);
  const handleHscPassYear = markDirty(setHscPassYear);
  const handleIsDiploma = markDirty(setIsDiploma);
  const handleDiplomaPercentage = markDirty(setDiplomaPercentage);
  const handleDiplomaPassYear = markDirty(setDiplomaPassYear);
  const handleUniversityPrn = markDirty(setUniversityPrn);
  const handleSgpaValues = markDirty(setSgpaValues);
  const handleSelectedSkills = markDirty(setSelectedSkills);
  const handleLinkedinUrl = markDirty(setLinkedinUrl);
  const handleGithubUrl = markDirty(setGithubUrl);
  const handlePortfolioLinks = markDirty(setPortfolioLinks);

  // ─── Username debounce ───────────────────────────────────────────────────────

  function handleUsernameChange(value: string) {
    const trimmed = value.trim();
    setUsername(trimmed);
    setIsDirty(true);
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    if (!trimmed) { setUsernameStatus("idle"); return; }
    if (trimmed === initialUsername.current) { setUsernameStatus("unchanged"); return; }
    if (!USERNAME_REGEX.test(trimmed)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    usernameDebounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_username_available", {
        p_username: trimmed,
        p_user_id: userProfile.id,
      });
      if (error) { setUsernameStatus("idle"); return; }
      setUsernameStatus(data === true ? "available" : "taken");
    }, 500);
  }

  useEffect(() => {
    return () => { if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current); };
  }, []);

  // ─── Warn on unsaved changes ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ─── Load institutes ─────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("institute_profiles")
        .select("profile_id, institute_name, courses, affiliation")
        .order("institute_name");
      if (data) {
        setInstitutes(data);
        if (initialData?.institute_id) {
          const found = data.find((i) => i.profile_id === initialData.institute_id);
          if (found) {
            setInstituteName(found.institute_name);
            setAvailableCourses(found.courses ?? []);
            setSelectedAffiliation(found.affiliation ?? null);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    const found = institutes.find((i) => i.profile_id === instituteId);
    if (found) {
      setAvailableCourses(found.courses ?? []);
      setSelectedAffiliation(found.affiliation ?? null);
      if (!found.courses?.includes(courseName)) setCourseName("");
    }
  }, [instituteId]);

  // ─── Avatar upload ───────────────────────────────────────────────────────────

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image must be smaller than 2 MB.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setAvatarSrc(blobUrl);
    setIsUploadingAvatar(true);
    try {
      const oldPath = storedImagePath.current;
      if (oldPath) {
        const { error: deleteError } = await supabase.storage.from("avatars").remove([oldPath]);
        if (deleteError) console.warn("Could not delete old avatar:", deleteError.message);
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const timestamp = Date.now();
      const newPath = `candidates/${userProfile.id}/profile/${timestamp}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newPath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase
        .from("candidate_profiles")
        .upsert({ profile_id: userProfile.id, profile_image_path: newPath }, { onConflict: "profile_id" });
      if (dbError) throw dbError;
      storedImagePath.current = newPath;
      const newPublicUrl = getStorageUrl(supabase, "avatars", newPath);
      setAvatarSrc(`${newPublicUrl}?v=${timestamp}`);
      URL.revokeObjectURL(blobUrl);
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload profile picture. Please try again.");
      setAvatarSrc(getStorageUrl(supabase, "avatars", storedImagePath.current));
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  // ─── Institute select ────────────────────────────────────────────────────────

  function handleInstituteSelect(name: string | null) {
    if (!name) {
      setInstituteId(""); setInstituteName(""); setAvailableCourses([]); setSelectedAffiliation(null); setIsDirty(true); return;
    }
    const found = institutes.find((i) => i.institute_name === name);
    if (found) {
      setInstituteId(found.profile_id);
      setInstituteName(found.institute_name);
      setAvailableCourses(found.courses ?? []);
      setSelectedAffiliation(found.affiliation ?? null);
      setIsDirty(true);
    }
  }

  // ─── SGPA ────────────────────────────────────────────────────────────────────

  function handleSgpaChange(index: number, value: string) {
    handleSgpaValues((prev) => {
      const u = [...prev]; u[index] = value; return u;
    });
  }

  // ─── Portfolio links ─────────────────────────────────────────────────────────

  function addPortfolioLink() { handlePortfolioLinks((prev) => [...prev, ""]); }

  function handlePortfolioLinkChange(index: number, value: string) {
    handlePortfolioLinks((prev) => { const u = [...prev]; u[index] = value; return u; });
  }

  function removePortfolioLink(index: number) {
    handlePortfolioLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Login History ───────────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    setSessLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSessions([]); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) setCurrentSessionId(getSessionIdFromJwt(session.access_token));
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, created_at, updated_at, not_after, ip, user_agent")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setSessions(data ?? []);
    } catch {
      toast.error("Failed to load login history.");
    } finally {
      setSessLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function handleRevokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      const { error } = await supabase.rpc("revoke_session", { p_session_id: sessionId });
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to revoke session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAllSessions() {
    const others = sessions.filter((s) => s.id !== currentSessionId);
    if (!others.length) { toast.info("No other active sessions."); return; }
    setRevokingAll(true);
    let ok = 0, fail = 0;
    for (const s of others) {
      try {
        const { error } = await supabase.rpc("revoke_session", { p_session_id: s.id });
        if (error) throw error;
        ok++;
        setSessions((prev) => prev.filter((x) => x.id !== s.id));
      } catch { fail++; }
    }
    setRevokingAll(false);
    fail === 0
      ? toast.success(`${ok} session${ok !== 1 ? "s" : ""} revoked.`)
      : toast.warning(`${ok} revoked, ${fail} failed.`);
  }

  const otherSessionCount = sessions.filter((s) => s.id !== currentSessionId).length;

  // ─── Password handlers ───────────────────────────────────────────────────────

  function clearPwError(key: string) {
    setPwErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validatePassword(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!pwCurrent) e.current = "Current password is required.";
    if (!pwNew) e.new = "New password is required.";
    else if (pwNew.length < 8) e.new = "Password must be at least 8 characters.";
    else if (pwStrength.score < 2) e.new = "Password is too weak — add uppercase letters, numbers, or symbols.";
    else if (pwCurrent && pwNew === pwCurrent) e.new = "New password must be different from your current password.";
    if (!pwConfirm) e.confirm = "Please confirm your new password.";
    else if (pwConfirm !== pwNew) e.confirm = "Passwords do not match.";
    return e;
  }

  function handlePasswordSubmit() {
    const errs = validatePassword();
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startPwTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: pwCurrent,
      });
      if (signInError) {
        setPwErrors({ current: "Current password is incorrect." });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: pwNew });
      if (updateError) {
        const msg = updateError.message ?? "";
        if (msg.toLowerCase().includes("same") || msg.toLowerCase().includes("different")) {
          setPwErrors({ new: "New password must be different from your current password." });
        } else if (msg.toLowerCase().includes("weak")) {
          setPwErrors({ new: "Password does not meet security requirements." });
        } else {
          toast.error("Failed to update password. Please try again.");
        }
        return;
      }

      toast.success("Password updated successfully!");
      setPwSuccess(true);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      setPwErrors({});
    });
  }

  // ─── Profile validation ───────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (username && !USERNAME_REGEX.test(username))
      e.username = "3–20 characters: letters, numbers, and underscores only.";
    if (usernameStatus === "taken") e.username = "This username is already taken.";
    if (usernameStatus === "checking") e.username = "Please wait for username availability check.";
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!gender) e.gender = "Gender is required";
    if (!phoneNumber.trim()) e.phoneNumber = "Contact number is required";
    else if (!/^[0-9]{10}$/.test(phoneNumber)) e.phoneNumber = "Must be exactly 10 digits";
    if (!dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!instituteId) e.institute = "Institution is required";
    if (!courseName) e.courseName = "Course/branch is required";
    if (!passoutYear) e.passoutYear = "Expected graduation year is required";
    if (!sscPercentage) e.sscPercentage = "SSC percentage is required";
    if (!sscPassYear) e.sscPassYear = "SSC passing year is required";
    if (!isHsc && !isDiploma) e.educationAfterSsc = "Select at least one option (HSC or Diploma)";
    if (isHsc && !hscPercentage) e.hscPercentage = "HSC percentage is required";
    if (isHsc && !hscPassYear) e.hscPassYear = "HSC passing year is required";
    if (isDiploma && !diplomaPercentage) e.diplomaPercentage = "Diploma percentage is required";
    if (isDiploma && !diplomaPassYear) e.diplomaPassYear = "Diploma passing year is required";
    if (selectedSkills.length === 0) e.skills = "Select at least one skill";
    if (aadhaarNumber && !/^[0-9]{12}$/.test(aadhaarNumber))
      e.aadhaarNumber = "Aadhaar must be exactly 12 digits";
    return e;
  }

  // ─── Discard ─────────────────────────────────────────────────────────────────

  function handleDiscard() {
    setUsername(userProfile.username ?? "");
    setUsernameStatus("idle");
    setFirstName(initialData?.first_name ?? "");
    setMiddleName(initialData?.middle_name ?? "");
    setLastName(initialData?.last_name ?? "");
    setGender(initialData?.gender ? GENDER_REVERSE[initialData.gender] ?? "" : "");
    setPhoneNumber(initialData?.phone_number ?? "");
    setDateOfBirth(initialData?.date_of_birth ? parseLocalDate(initialData.date_of_birth) : undefined);
    setAadhaarNumber(initialData?.aadhaar_number ?? "");
    setCurrentAddress(initialData?.current_address ?? "");
    setPermanentAddress(initialData?.permanent_address ?? "");
    setInstituteId(initialData?.institute_id ?? "");
    setCourseName(initialData?.course_name ?? "");
    setPassoutYear(initialData?.passout_year ? String(initialData.passout_year) : "");
    setSscPercentage(initialData?.ssc_percentage != null ? String(initialData.ssc_percentage) : "");
    setSscPassYear(initialData?.ssc_pass_year ? String(initialData.ssc_pass_year) : "");
    setIsHsc(initialData?.is_hsc ?? false);
    setHscPercentage(initialData?.hsc_percentage != null ? String(initialData.hsc_percentage) : "");
    setHscPassYear(initialData?.hsc_pass_year ? String(initialData.hsc_pass_year) : "");
    setIsDiploma(initialData?.is_diploma ?? false);
    setDiplomaPercentage(initialData?.diploma_percentage != null ? String(initialData.diploma_percentage) : "");
    setDiplomaPassYear(initialData?.diploma_pass_year ? String(initialData.diploma_pass_year) : "");
    setUniversityPrn(initialData?.university_prn ?? "");
    setSgpaValues(Array.from({ length: 8 }, (_, i) => {
      const val = initialData?.[`sgpa_sem${i + 1}`]; return val != null ? String(val) : "";
    }));
    setSelectedSkills(initialData?.skills ?? []);
    setLinkedinUrl(initialData?.linkedin_url ?? "");
    setGithubUrl(initialData?.github_url ?? "");
    setPortfolioLinks(initialData?.portfolio_links?.length ? initialData.portfolio_links : [""]);
    setErrors({});
    setIsDirty(false);
    toast.info("Changes discarded.");
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  function handleSave() {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }
    startTransition(async () => {
      const trimmedUsername = username.trim() || null;
      if (trimmedUsername !== (userProfile.username ?? null)) {
        const { error: usernameError } = await supabase
          .from("profiles")
          .update({ username: trimmedUsername })
          .eq("id", userProfile.id);
        if (usernameError) {
          if (usernameError.code === "23505") {
            setErrors((prev) => ({ ...prev, username: "This username is already taken." }));
            setUsernameStatus("taken");
          } else {
            toast.error("Failed to update username. Please try again.");
          }
          return;
        }
      }

      const payload = {
        profile_id: userProfile.id,
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        gender: GENDER_MAP[gender] ?? null,
        phone_number: phoneNumber.trim() || null,
        date_of_birth: dateOfBirth ? toLocalDateString(dateOfBirth) : null,
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
        profile_updated: true,
      };

      const { error } = await supabase
        .from("candidate_profiles")
        .upsert(payload, { onConflict: "profile_id" });

      if (error) {
        console.error(error);
        toast.error("Failed to save profile. Please try again.");
      } else {
        toast.success("Profile saved successfully!");
        setIsDirty(false);
        if (trimmedUsername) {
          initialUsername.current = trimmedUsername;
          setUsernameStatus("unchanged");
        }
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const instituteNames = institutes.map((i) => i.institute_name);
  const usernameMsg = usernameStatusMessage(usernameStatus);

  return (
    <div className="min-h-screen w-full">
      {/* Page Header */}
      <div className="px-4 pt-8 pb-0 md:px-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and account preferences</p>
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

          {/* ── ACCOUNT TAB ── */}
          <TabsContent value="account" className="space-y-6 mt-0">

            {/* Username */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Your unique username is used to identify you on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="yourusername"
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
                      3–20 characters: letters, numbers, and underscores only — cannot be changed after saving
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Photo */}
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
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                        : <><Upload className="h-4 w-4 mr-2" />Upload Photo</>}
                    </Button>
                    <p className="text-xs text-muted-foreground">Square image recommended · max 2 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
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
                    <Combobox items={GENDER_OPTIONS} value={gender} onValueChange={(v) => handleGender(v)}>
                      <ComboboxInput placeholder="Select gender" />
                      <ComboboxContent>
                        <ComboboxEmpty>No gender found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
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
                          onSelect={(date) => { handleDateOfBirth(date); setDobOpen(false); }}
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
                  <Textarea placeholder="Current address" rows={3} value={currentAddress} onChange={(e) => handleCurrentAddress(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permanent Address</Label>
                    <Button variant="ghost" size="sm" type="button" onClick={() => handlePermanentAddress(currentAddress)}>
                      <Copy className="h-3 w-3 mr-1" />Same as current
                    </Button>
                  </div>
                  <Textarea placeholder="Permanent address" rows={3} value={permanentAddress} onChange={(e) => handlePermanentAddress(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Education Details */}
            <Card>
              <CardHeader>
                <CardTitle>Education Details</CardTitle>
                <CardDescription>Your academic background and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Institution<RequiredMark /></Label>
                  <Combobox items={instituteNames} value={instituteName} onValueChange={handleInstituteSelect}>
                    <ComboboxInput placeholder="Search institution…" />
                    <ComboboxContent>
                      <ComboboxEmpty>No institution found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {selectedAffiliation && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Affiliated to {selectedAffiliation}
                    </p>
                  )}
                  <FieldError message={errors.institute} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Branch / Course<RequiredMark /></Label>
                    <Combobox items={availableCourses} value={courseName} onValueChange={(v) => handleCourseName(v)} disabled={!instituteId}>
                      <ComboboxInput
                        placeholder={!instituteId ? "Select institution first" : availableCourses.length ? "Select course" : "No courses available"}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No course found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.courseName} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label>Expected Graduation Year<RequiredMark /></Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="What is graduation year?">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
                            <p className="font-medium mb-1">How to pick the right year?</p>
                            <p>Select the year when you will finish your degree and receive your marksheet/certificate.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Combobox items={PASSOUT_YEAR_OPTIONS} value={passoutYear} onValueChange={(v) => handlePassoutYear(v)}>
                      <ComboboxInput placeholder="Select graduation year" />
                      <ComboboxContent>
                        <ComboboxEmpty>No year found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errors.passoutYear ? (
                      <FieldError message={errors.passoutYear} />
                    ) : passoutYear ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {getGraduationYearHint(passoutYear)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        The year you will receive your final degree marksheet/certificate
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SSC Percentage<RequiredMark /></Label>
                    <Input placeholder="e.g. 85.60" type="number" step={0.01} min={0} max={100} value={sscPercentage} onChange={(e) => handleSscPercentage(e.target.value)} />
                    <FieldError message={errors.sscPercentage} />
                  </div>
                  <div className="space-y-2">
                    <Label>SSC Passing Year<RequiredMark /></Label>
                    <Combobox items={YEAR_OPTIONS} value={sscPassYear} onValueChange={(v) => handleSscPassYear(v)}>
                      <ComboboxInput placeholder="Select year" />
                      <ComboboxContent>
                        <ComboboxEmpty>No year found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError message={errors.sscPassYear} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Education After SSC<RequiredMark /></Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isHsc} onChange={(e) => handleIsHsc(e.target.checked)} className="h-4 w-4 accent-primary" />
                      <span className="text-sm">HSC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isDiploma} onChange={(e) => handleIsDiploma(e.target.checked)} className="h-4 w-4 accent-primary" />
                      <span className="text-sm">Diploma</span>
                    </label>
                  </div>
                  <FieldError message={errors.educationAfterSsc} />

                  {isHsc && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>HSC Percentage<RequiredMark /></Label>
                        <Input placeholder="e.g. 78.40" type="number" step={0.01} max={100} value={hscPercentage} onChange={(e) => handleHscPercentage(e.target.value)} />
                        <FieldError message={errors.hscPercentage} />
                      </div>
                      <div className="space-y-2">
                        <Label>HSC Passing Year<RequiredMark /></Label>
                        <Combobox items={YEAR_OPTIONS} value={hscPassYear} onValueChange={(v) => handleHscPassYear(v)}>
                          <ComboboxInput placeholder="Select year" />
                          <ComboboxContent>
                            <ComboboxEmpty>No year found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError message={errors.hscPassYear} />
                      </div>
                    </div>
                  )}

                  {isDiploma && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>Diploma Percentage<RequiredMark /></Label>
                        <Input placeholder="e.g. 72.00" type="number" step={0.01} max={100} value={diplomaPercentage} onChange={(e) => handleDiplomaPercentage(e.target.value)} />
                        <FieldError message={errors.diplomaPercentage} />
                      </div>
                      <div className="space-y-2">
                        <Label>Diploma Passing Year<RequiredMark /></Label>
                        <Combobox items={YEAR_OPTIONS} value={diplomaPassYear} onValueChange={(v) => handleDiplomaPassYear(v)}>
                          <ComboboxInput placeholder="Select year" />
                          <ComboboxContent>
                            <ComboboxEmpty>No year found.</ComboboxEmpty>
                            <ComboboxList>
                              {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldError message={errors.diplomaPassYear} />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>University PRN</Label>
                  <Input placeholder="University PRN / Enrollment number" value={universityPrn} onChange={(e) => handleUniversityPrn(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <Label>Semester SGPA</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sgpaValues.map((val, i) => (
                      <div key={i} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sem {i + 1}</Label>
                        <Input
                          placeholder="0.00"
                          type="number"
                          step={0.01}
                          min={0}
                          max={10}
                          value={val}
                          onChange={(e) => handleSgpaChange(i, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
                <CardDescription>Skills and online profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2" ref={skillsAnchor}>
                  <Label>Skills<RequiredMark /></Label>
                  <Combobox
                    items={SOFTWARE_SKILLS}
                    value={selectedSkills}
                    onValueChange={(v) => handleSelectedSkills(v as string[])}
                    multiple
                  >
                    <ComboboxChips>
                      {selectedSkills.map((skill) => (
                        <ComboboxChip key={skill} showRemove>{skill}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder={selectedSkills.length ? "Add more…" : "Search skills…"} />
                    </ComboboxChips>
                    <ComboboxContent>
                      <ComboboxEmpty>No skill found.</ComboboxEmpty>
                      <ComboboxList>
                        {SOFTWARE_SKILLS.map((item) => (
                          <ComboboxItem key={item} value={item}>
                            <ComboboxValue>{item}</ComboboxValue>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError message={errors.skills} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LinkedIn URL</Label>
                    <Input placeholder="https://linkedin.com/in/yourprofile" type="url" value={linkedinUrl} onChange={(e) => handleLinkedinUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input placeholder="https://github.com/yourusername" type="url" value={githubUrl} onChange={(e) => handleGithubUrl(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Portfolio / Project Links</Label>
                  {portfolioLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={link}
                        onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                        placeholder="https://yourproject.com"
                        type="url"
                      />
                      {portfolioLinks.length > 1 && (
                        <Button variant="ghost" size="icon" type="button" onClick={() => removePortfolioLink(index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPortfolioLink} type="button">
                    <Plus className="h-4 w-4 mr-2" />Add link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SECURITY TAB ── */}
          <TabsContent value="security" className="space-y-6 mt-0">

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account secure with a strong password</CardDescription>
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
                      <Label htmlFor="pw-current">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="pw-current"
                          type={pwShowCurrent ? "text" : "password"}
                          placeholder="Enter your current password"
                          value={pwCurrent}
                          autoComplete="current-password"
                          disabled={isPwPending}
                          className={cn("pr-10", pwErrors.current && "border-destructive focus-visible:ring-destructive")}
                          onChange={(e) => { setPwCurrent(e.target.value); clearPwError("current"); }}
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
                      <Label htmlFor="pw-new">New Password</Label>
                      <div className="relative">
                        <Input
                          id="pw-new"
                          type={pwShowNew ? "text" : "password"}
                          placeholder="Enter a strong new password"
                          value={pwNew}
                          autoComplete="new-password"
                          disabled={isPwPending}
                          className={cn("pr-10", pwErrors.new && "border-destructive focus-visible:ring-destructive")}
                          onChange={(e) => { setPwNew(e.target.value); clearPwError("new"); }}
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
                      <Label htmlFor="pw-confirm">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="pw-confirm"
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
                          onChange={(e) => { setPwConfirm(e.target.value); clearPwError("confirm"); }}
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

          {/* ── BILLING TAB ── */}
          <TabsContent value="billing" className="mt-0">
            <Card>
              <CardHeader><CardTitle>Billing</CardTitle><CardDescription>Subscription and payments</CardDescription></CardHeader>
              <CardContent><p className="text-sm">Current Plan: <strong>Free</strong></p></CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTIFICATIONS TAB ── */}
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Manage how you receive updates</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Email Alerts", desc: "Receive important notifications via email" },
                  { label: "Job Updates", desc: "Get notified about new job opportunities" },
                  { label: "Group Notifications", desc: "Updates from groups and communities you joined" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div><Label>{label}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOGIN HISTORY TAB ── */}
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Devices currently signed in to your account</CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={loadSessions} disabled={sessionsLoading} className="gap-1.5 text-xs h-8">
                    {sessionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Refresh
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleRevokeAllSessions}>
                            Sign out all
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

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

                {!sessionsLoading && sessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No sessions found</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Login activity will appear here once detected.</p>
                  </div>
                )}

                {!sessionsLoading && sessions.length > 0 && (
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const { browser, os, device } = parseUserAgent(session.user_agent);
                      const isCurrent = session.id === currentSessionId;
                      const expired = isExpired(session.not_after);
                      const expiryLabel = formatExpiry(session.not_after);
                      const isRevoking = revokingId === session.id;

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
                                  {isRevoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
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
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRIVACY TAB ── */}
          <TabsContent value="privacy" className="space-y-6 mt-0">
            <Card>
              <CardHeader><CardTitle>Privacy Controls</CardTitle><CardDescription>Manage your data privacy</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Public Profile", desc: "Make your profile visible to recruiters" },
                  { label: "Allow Data Usage", desc: "Help improve platform with usage data" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div><Label>{label}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Data Management</CardTitle><CardDescription>Export or delete your account data</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline">Export All Data</Button>
                <Button variant="outline" className="text-destructive hover:text-destructive">Request Account Deletion</Button>
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
  );
}
