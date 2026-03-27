// lib/supabase/middleware.ts
//
// Session refresh + route-protection logic called by /middleware.ts.
//
// Separated here so it can be unit-tested independently of the Next.js
// middleware edge runtime.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Route rules ──────────────────────────────────────────────────────────────

/** Routes that require an authenticated session. */
const PROTECTED_PATHS = ["/~"] as const;

/** Routes that should NOT be visited while authenticated. */
const AUTH_PATHS = ["/auth"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// ─── updateSession ─────────────────────────────────────────────────────────────

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. If it's a completely public route (neither protected nor auth),
  //    we skip the authentication session initialization entirely.
  if (!isProtected(pathname) && !isAuthPage(pathname)) {
    return NextResponse.next({ request });
  }

  // Start with a plain pass-through response.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated cookies back onto the request object …
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // … and onto the response so the browser receives them.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );


  // 2. We use getSession() instead of getUser() to prevent "Auth Storms" (504s)
  //    that occur when the Auth server is hit on every request under high load.
  //    While getSession() only trusts the JWT in the cookie, it is significantly
  //    faster and reliable for middleware routing logic. Hardened security
  //    checks must continue to use getUser() in Server Components and Actions.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Redirect unauthenticated user trying to reach a protected page → login.
  if (isProtected(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user visiting an auth page → app home.
  // Exception: /auth/callback and /auth/confirm handle OAuth / token flows.
  const isFlowRoute =
    pathname.includes("/auth/callback") ||
    pathname.includes("/auth/confirm");

  if (isAuthPage(pathname) && !isFlowRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/~";
    homeUrl.search = ""; // Clear accidental params
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}