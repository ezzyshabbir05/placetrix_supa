import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ─── Route config ─────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ["/~/"] as const

const PUBLIC_PREFIXES = [
    "/auth/",
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

    // ── Why getClaims() only, never getUser() here ────────────────────────────
    //
    // getUser() makes a live network request on EVERY middleware execution.
    // Offline or flaky connections cause it to fail → false logout → loop.
    //
    // getClaims() verifies the JWT locally via WebCrypto against the cached
    // JWKS public key (asymmetric signing key). No network required after the
    // initial key fetch. It also returns null for expired tokens, so expiry
    // is still enforced correctly.
    //
    // Server-side revocations (a rare event) are caught one request later
    // inside getUserProfile() where getUser() IS called and we handle its
    // errors properly without causing a redirect loop.
    // ─────────────────────────────────────────────────────────────────────────

    const { data: claimsData } = await supabase.auth.getClaims()
    const authenticated = !!claimsData?.claims

    if (isProtected(request.nextUrl.pathname) && !authenticated) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/auth/login"
        loginUrl.searchParams.set("next", request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}
