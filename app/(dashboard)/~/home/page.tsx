import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
  CalendarClock,
  CheckCircle2,
  Users,
  ListCheck,
  PenLine,
  BarChart3,
} from "lucide-react";
import { deriveStatus } from "@/app/(dashboard)/~/tests/_types";


// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: "green" | "amber" | "blue" | "muted";
}) {
  const accentClass =
    accent === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : "text-foreground";

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}


// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <Link
        href={href}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        View all
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const profile = await getUserProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // ── Candidate ──────────────────────────────────────────────────────────────
  if (profile.account_type === "candidate") {
    const { data: cp } = await supabase
      .from("candidate_profiles")
      .select("profile_complete, profile_updated, first_name, last_name, phone_number, date_of_birth, gender, institute_id, course_name, passout_year, ssc_percentage")
      .eq("profile_id", profile.id)
      .maybeSingle();

    const isComplete   = cp?.profile_complete === true;
    const hasBeenSaved = cp?.profile_updated  === true;
    const profileReady = isComplete && hasBeenSaved;

    const profileSubtitle = !cp
      ? "You haven't set up your profile yet. Fill in your details to access all features."
      : !hasBeenSaved
      ? "Your profile has been started but not saved yet."
      : "A few required fields are still missing.";

    // ── Fetch test stats ────────────────────────────────────────────────────
    let totalTests = 0;
    let liveTests = 0;
    let upcomingTests = 0;
    let completedTests = 0;

    if (cp?.institute_id) {
      const { data: rawTests } = await supabase
        .from("tests")
        .select("id, available_from, available_until")
        .eq("status", "published")
        .eq("institute_id", cp.institute_id);

      if (rawTests?.length) {
        totalTests = rawTests.length;
        const testIds = rawTests.map((t) => t.id);

        const now = new Date();
        for (const t of rawTests) {
          const from  = t.available_from  ? new Date(t.available_from)  : null;
          const until = t.available_until ? new Date(t.available_until) : null;
          if (from && from > now)         upcomingTests++;
          else if (until && until < now)  { /* past */ }
          else                             liveTests++;
        }

        // Submitted attempts by this candidate
        const { data: attempts } = await supabase
          .from("test_attempts")
          .select("test_id")
          .eq("student_id", profile.id)
          .eq("status", "submitted")
          .in("test_id", testIds);

        completedTests = attempts?.length ?? 0;
      }
    }

    return (
      <div className="min-h-screen w-full">
        <div className="px-4 pt-8 pb-0 md:px-8">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">Home</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back{profile.username ? `, @${profile.username}` : ""}
            </p>
          </div>
        </div>

        <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">

          {/* ── Profile banner ───────────────────────────────────────────── */}
          {!profileReady && (
            <div className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Your profile isn't complete yet</p>
                <p className="text-xs text-muted-foreground">{profileSubtitle}</p>
              </div>
              <Link href="/~/settings" className="shrink-0">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  Complete Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* ── Test Stats ───────────────────────────────────────────────── */}
          {cp?.institute_id && (
            <div className="space-y-3">
              <SectionHeader title="Tests Overview" href="/~/tests" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Assigned"
                  value={totalTests}
                />
                <StatCard
                  icon={<PlayCircle className="h-4 w-4" />}
                  label="Live Now"
                  value={liveTests}
                  accent={liveTests > 0 ? "green" : "muted"}
                />
                <StatCard
                  icon={<CalendarClock className="h-4 w-4" />}
                  label="Upcoming"
                  value={upcomingTests}
                  accent={upcomingTests > 0 ? "amber" : "muted"}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Completed"
                  value={completedTests}
                  accent={completedTests > 0 ? "blue" : "muted"}
                />
              </div>
            </div>
          )}

          {/* ── View Tests CTA (when profile ready but no institute) ─────── */}
          {profileReady && !cp?.institute_id && (
            <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Looking for tests?</p>
                <p className="text-xs text-muted-foreground">
                  Browse available assessments assigned to you.
                </p>
              </div>
              <Link href="/~/tests" className="shrink-0">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  View Tests
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Institute ──────────────────────────────────────────────────────────────
  if (profile.account_type === "institute") {
    const { data: ip } = await supabase
      .from("institute_profiles")
      .select("profile_complete, profile_updated, institute_name, affiliation, address, city, state, phone_number, email, principal_name")
      .eq("profile_id", profile.id)
      .maybeSingle();

    const isComplete   = ip?.profile_complete === true;
    const hasBeenSaved = ip?.profile_updated  === true;
    const profileReady = isComplete && hasBeenSaved;

    const profileSubtitle = !ip
      ? "You haven't set up your institution profile yet. Add your details to get started."
      : !hasBeenSaved
      ? "Your profile has been started but not saved yet."
      : "A few required fields are still missing.";

    // ── Fetch test stats ────────────────────────────────────────────────────
    const { data: rawTests } = await supabase
      .from("tests")
      .select(
        `id, status, available_from, available_until,
         questions(count),
         test_attempts(count)`
      )
      .eq("institute_id", profile.id);

    let totalTests    = 0;
    let liveTests     = 0;
    let upcomingTests = 0;
    let pastTests     = 0;
    let draftTests    = 0;
    let totalAttempts = 0;

    for (const t of rawTests ?? []) {
      totalTests++;
      const derived = deriveStatus(t.status, t.available_from, t.available_until);
      if (derived === "live")     liveTests++;
      if (derived === "upcoming") upcomingTests++;
      if (derived === "past")     pastTests++;
      if (derived === "draft")    draftTests++;
      totalAttempts += (t.test_attempts as unknown as { count: number }[])?.[0]?.count ?? 0;
    }

    return (
      <div className="min-h-screen w-full">
        <div className="px-4 pt-8 pb-0 md:px-8">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">Home</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back{profile.username ? `, @${profile.username}` : ""}
            </p>
          </div>
        </div>

        <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">

          {/* ── Profile banner ───────────────────────────────────────────── */}
          {!profileReady && (
            <div className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Your institution profile isn't complete yet</p>
                <p className="text-xs text-muted-foreground">{profileSubtitle}</p>
              </div>
              <Link href="/~/settings" className="shrink-0">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  Complete Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* ── Test Stats ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <SectionHeader title="Tests Overview" href="/~/tests" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard
                icon={<ListCheck className="h-4 w-4" />}
                label="Total Tests"
                value={totalTests}
              />
              <StatCard
                icon={<PlayCircle className="h-4 w-4" />}
                label="Live"
                value={liveTests}
                accent={liveTests > 0 ? "green" : "muted"}
              />
              <StatCard
                icon={<CalendarClock className="h-4 w-4" />}
                label="Upcoming"
                value={upcomingTests}
                accent={upcomingTests > 0 ? "amber" : "muted"}
              />
              <StatCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Past"
                value={pastTests}
              />
              <StatCard
                icon={<PenLine className="h-4 w-4" />}
                label="Drafts"
                value={draftTests}
              />
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Attempts"
                value={totalAttempts}
                accent={totalAttempts > 0 ? "blue" : "muted"}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  redirect("/~/home");
}