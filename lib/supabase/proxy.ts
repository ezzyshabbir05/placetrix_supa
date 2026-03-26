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

  const { pathname } = request.nextUrl;

  // 1. If it's a completely public route (neither protected nor auth),
  //    we skip the heavy getUser() network call entirely.
  if (!isProtected(pathname) && !isAuthPage(pathname)) {
    return supabaseResponse;
  }

  // 2. Optimization: Check for prefetch requests.
  //    Next.js prefetches follow links; we can trust the cookie (getSession)
  //    for the prefetch to stay fast (~1ms). If the user actually clicks
  //    the link, the "real" request will trigger getUser() (~50ms) for 
  //    full security validation. This helps avoid "Auth Storms" (504s).
  const isPrefetch = request.headers.get("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch";

  let user = null;

  if (isPrefetch) {
    // For prefetches, getSession() reads the JWT but doesn't hit the server.
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  } else {
    // For real requests, getUser() re-validates with the Auth server.
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    user = authedUser;
  }

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