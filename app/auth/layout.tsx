import { Suspense } from "react";
import { FloatingPaths } from "@/components/ui/auth_page/floating-paths";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Auth guard: kick logged-in users out of auth routes ──
    // getUser() validates with Supabase server, so revoked sessions are
    // correctly treated as unauthenticated (getClaims only decodes the
    // local JWT and would redirect revoked users back here, causing a loop).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/~");

    return (
        <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">

            {/* ── Left Panel (desktop only) ── */}
            <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none" />

                <Link href="/" className="font-bold text-xl">
                    PlaceTrix
                </Link>

                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl">
                            &ldquo;Placetrix helped me crack my dream company placement — the
                            mock tests are incredibly accurate.&rdquo;
                        </p>
                        <footer className="font-mono font-semibold text-sm">
                            ~ Priya Sharma
                        </footer>
                    </blockquote>
                </div>

                {/* Floating animation — pointer-events-none so it never blocks clicks */}
                <div className="absolute inset-0 pointer-events-none">
                    <Suspense fallback={null}>
                        <FloatingPaths position={1} />
                        <FloatingPaths position={-1} />
                    </Suspense>
                </div>
            </div>

            {/* ── Right Panel wrapper — children slot ── */}
            <div className="relative flex min-h-screen flex-col justify-center px-8">

                {/* Decorative radial background shades */}
                <div
                    aria-hidden
                    className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
                >
                    <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
                    <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
                </div>

                {/* Page content goes here */}
                {children}
            </div>

        </main>
    );
}