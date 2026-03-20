import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

// ─── Route configuration ───────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ["/~/"] as const;
const PUBLIC_PREFIXES    = ["/auth/", "/_next/", "/favicon.ico"] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// ─── updateSession ─────────────────────────────────────────────────────────────

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const requestHeaders = new Headers(request.headers);
  // Forward pathname for server layouts (e.g. auth recovery-flow exceptions).
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // Re-create response to preserve x-pathname header after cookie refresh.
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /**
   * ── getClaims() only — never getUser() in middleware ─────────────────────
   *
   * getClaims() verifies the JWT locally against the cached JWKS public key
   * (asymmetric signing). Zero network round-trips after the initial key fetch.
   * getUser() hits the Auth server on EVERY middleware invocation — thousands
   * of requests/sec on a busy app. [web:6][web:12]
   *
   * Revoked sessions are caught on the next protected page render inside
   * getUserProfile() where getUser() IS called and errors are handled safely.
   */
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAuthenticated = !!claimsData?.claims;

  if (isProtectedRoute(request.nextUrl.pathname) && !isAuthenticated) {
    return buildLoginRedirect(request);
  }

  return supabaseResponse;
}
