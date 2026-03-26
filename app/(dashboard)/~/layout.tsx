import { AppSidebar } from "@/components/app-sidebar"
import { getUserProfile } from "@/lib/supabase/profile"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // getUserProfile() handles all redirect cases internally:
    //   • Revoked session (online 401)  → signs out + redirects
    //   • Token expired offline          → redirects
    //   • Network failure + valid JWT   → returns minimal offline profile
    // If we reach this line, profile is always a valid object.
    const profile = await getUserProfile()

    return (
        <DashboardShell
            sidebar={<AppSidebar user={profile} />}
        >
            {children}
        </DashboardShell>
    )
}
