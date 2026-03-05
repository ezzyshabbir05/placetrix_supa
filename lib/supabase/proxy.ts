import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ─── Route config ─────────────────────────────────────────────────────────────

/**
 * All path prefixes that require an authenticated session.
 * Add new protected areas here — nowhere else.
 */
const PROTECTED_PREFIXES = ["/~/"] as const

/**
 * Paths that are always public, even if they accidentally match a
 * protected prefix pattern above.
 */
const PUBLIC_PREFIXES = [
    "/auth/",
    "/login",
    "/_next/",
    "/favicon.ico",
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isProtected(pathname: string): boolean {
    const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
    if (isPublic) return false
    return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

// ─── Session updater ──────────────────────────────────────────────────────────

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    // Always create a fresh client per request (Fluid compute safe).
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    // Do not run code between createServerClient and the auth check.
    // A simple mistake could make it very hard to debug users being logged out.

    // Fast local JWT decode first — avoids a network round-trip on every
    // public/static request.
    const { data: claimsData } = await supabase.auth.getClaims()
    let authenticated = !!claimsData?.claims

    // For protected routes we MUST verify the session against the Supabase
    // server. getClaims() only decodes the local JWT and has no knowledge of
    // server-side revocations, so a revoked device would otherwise still be
    // treated as logged in here, causing a redirect loop with the auth layout.
    if (authenticated && isProtected(request.nextUrl.pathname)) {
        const { data: userData } = await supabase.auth.getUser()
        authenticated = !!userData.user
    }

    if (isProtected(request.nextUrl.pathname) && !authenticated) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/auth/login"

        // Preserve the original destination so we can redirect back after login
        loginUrl.searchParams.set("next", request.nextUrl.pathname)

        return NextResponse.redirect(loginUrl)
    }

    // IMPORTANT: return supabaseResponse as-is to keep cookies in sync.
    return supabaseResponse
}