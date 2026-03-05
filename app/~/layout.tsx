import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { getUserProfile } from "@/lib/supabase/profile"
import { DashboardShell } from "@/components/dashboard-shell"


async function SidebarLoader() {
    const profile = await getUserProfile()
    if (!profile) redirect("/auth/login")
    return <AppSidebar user={profile} />
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardShell
            sidebar={
                <Suspense
                    fallback={<AppSidebar user={null} />}
                >
                    <SidebarLoader />
                </Suspense>
            }
        >
            {children}
        </DashboardShell>
    )
}
