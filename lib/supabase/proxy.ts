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
const PROTECTED_PREFIXES = ["/~/"] as const;

/** Routes that should NOT be visited while authenticated. */
const AUTH_PREFIXES = ["/auth/"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── updateSession ─────────────────────────────────────────────────────────────

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Start with a plain pass-through response.
  // We mutate this reference inside setAll() so cookies are always written.
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

  // ✅  getUser() validates the JWT with the Auth server — not spoofable.
  //    getClaims() / getSession() only trust the local cookie and must NOT
  //    be used for access-control decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user trying to reach a protected page → login.
  if (isProtected(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting an auth page → app home.
  // Exception: /auth/callback and /auth/confirm handle OAuth / token flows
  // and must be reachable even with a valid session.
  const isFlowRoute =
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/confirm");

  if (isAuthPage(pathname) && !isFlowRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/~";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}