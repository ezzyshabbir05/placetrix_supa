import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";


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

        <div className="px-4 py-6 md:px-8 md:py-8 space-y-3">

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

          {profileReady && (
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

        <div className="px-4 py-6 md:px-8 md:py-8 space-y-3">

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

        </div>
      </div>
    );
  }

  redirect("/~/home");
}