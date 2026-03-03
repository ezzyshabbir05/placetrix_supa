import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AppSidebar, AppSidebarSkeleton } from "@/components/app-sidebar"
import { getUserProfile } from "@/lib/supabase/profile"
import { DashboardShell } from "@/components/dashboard-shell"


// ─── Sidebar Loader (async server component) ──────────────────────────────────


/**
 * Isolated so Suspense can show AppSidebarSkeleton while the profile
 * fetch is in-flight, without blocking children from rendering.
 */
async function SidebarLoader() {
    const profile = await getUserProfile()

    if (!profile) {
        redirect("/auth/login")
    }

    return <AppSidebar user={profile} />
}


// ─── Layout ───────────────────────────────────────────────────────────────────


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardShell
            sidebar={
                <Suspense fallback={<AppSidebarSkeleton />}>
                    <SidebarLoader />
                </Suspense>
            }
        >
            {children}
        </DashboardShell>
    )
}
