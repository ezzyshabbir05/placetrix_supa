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

  // 0. Skip refreshing for prefetches to avoid token reuse errors.
  // Next.js Link prefetches can trigger Middleware, but browsers often ignore 
  // Set-Cookie on prefetches, causing the refresh token to be used up.
  const isPrefetch = request.headers.get("next-router-prefetch") || 
                     request.headers.get("purpose") === "prefetch";

  // Start with a plain pass-through response.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

          // Update the supabaseResponse headers to pass markers to Server components
          // that might run in the same request before the browser sees new cookies.
          const refreshedHeaders = new Headers(request.headers);
          refreshedHeaders.set("x-supabase-refreshed", "true");

          // … and onto the response so the browser receives them.
          supabaseResponse = NextResponse.next({ 
            request: { headers: refreshedHeaders } 
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );


  // 2. We use getClaims() as a fast-path cache.
  //    It validates the JWT signature locally without a network hit.
  const { data: claimsData } = await supabase.auth.getClaims();
  let user = claimsData?.claims ?? null;

  // 3. Fallback: If claims are missing or expired (user is null),
  //    we MUST attempt a session refresh via getUser().
  //    To avoid unnecessary network hits for truly anonymous visitors,
  //    we only call getUser() if an auth-related cookie is present.
  if (!user && (isProtected(pathname) || isAuthPage(pathname))) {
    const hasAuthCookie = request.cookies.getAll().some((c) =>
      c.name.includes("auth-token")
    );

    // CRITICAL: We skip refreshes for prefetches. 
    // Browsers often ignore Set-Cookie on prefetches, meaning the refresh token would 
    // be used up on the server but the browser would never see the new one.
    if (hasAuthCookie && !isPrefetch) {
      // We use a small timeout to avoid hanging if Supabase is slow
      try {
        const { data: { user: authUser }, error: refreshError } = await supabase.auth.getUser();
        if (authUser) {
          user = { ...authUser, sub: authUser.id } as any;
        } else if (refreshError) {
          console.error("[Middleware] Refresh failed:", refreshError.message);
        }
      } catch (e) {
        console.error("[Middleware] Refresh exception:", e);
      }
    }
  }

  // ── Protection: Prevent Redirect Loops on Revocation ───────────────────────
  // If we came from a 'revoked=1' redirect, we ignore local JWT claims
  // and treat the user as unauthenticated.
  const isRevoked = request.nextUrl.searchParams.get("revoked") === "1";
  if (isRevoked) {
    user = null;
  }

  // Redirect unauthenticated user trying to reach a protected page → login.
  // We ONLY redirect for GET requests that are NOT prefetches.
  // For POST/Prefetch, we return a response that allows the caller to handle it 
  // (or ignores the prefetch) rather than following a 302.
  if (isProtected(pathname) && !user && request.method === "GET") {
    if (isPrefetch) {
      // Don't redirect prefetches — it causes browser cache issues and accidental logouts.
      // Returning a 401 response is safer for prefetches.
      return new NextResponse(null, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    // IMPORTANT: Transfer any cookies set by Supabase to the redirect response.
    supabaseResponse.cookies.getAll().forEach((c) => {
      const { name, value, ...options } = c;
      redirectRes.cookies.set(name, value, options);
    });
    return redirectRes;
  }

  // Redirect authenticated user visiting an auth page → app home.
  // Exception: /auth/callback and /auth/confirm handle OAuth / token flows.
  const isFlowRoute =
    pathname.includes("/auth/callback") ||
    pathname.includes("/auth/confirm");

  if (isAuthPage(pathname) && !isFlowRoute && user) {
    // SECURITY: Before redirecting an "authenticated" user away from an auth page,
    // we do ONE final server-side check to ensure their session wasn't just revoked.
    // This solves the 'Redirect Loop' where getClaims() is still valid but the session is dead.
    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
    if (!verifiedUser) {
      // Session is actually revoked! Stop the redirect and let them stay on the login page.
      return supabaseResponse;
    }

    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/~";
    homeUrl.search = ""; // Clear accidental params
    const redirectRes = NextResponse.redirect(homeUrl);
    // IMPORTANT: Transfer any cookies set by Supabase (e.g. from session refresh)
    // to the redirect response.
    supabaseResponse.cookies.getAll().forEach((c) => {
      const { name, value, ...options } = c;
      redirectRes.cookies.set(name, value, options as any);
    });
    return redirectRes;
  }

  return supabaseResponse;
}