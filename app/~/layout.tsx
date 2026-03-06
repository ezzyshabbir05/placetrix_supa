import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { getUserProfile } from "@/lib/supabase/profile"
import { DashboardShell } from "@/components/dashboard-shell"

async function SidebarLoader() {
    // getUserProfile() handles all redirect cases internally:
    //   • Revoked session (online 401)  → signs out + redirects
    //   • Token expired offline          → redirects
    //   • Network failure + valid JWT   → returns minimal offline profile
    // If we reach this line, profile is always a valid object.
    const profile = await getUserProfile()
    return <AppSidebar user={profile} />
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardShell
            sidebar={
                <Suspense fallback={<AppSidebar user={null} />}>
                    <SidebarLoader />
                </Suspense>
            }
        >
            {children}
        </DashboardShell>
    )
}
