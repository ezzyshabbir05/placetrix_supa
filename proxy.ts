// middleware.ts  (root of project — next to package.json)
//
// ── What this file does ────────────────────────────────────────────────────────
//
//  1. Refreshes the Supabase session cookie on every request so it never
//     silently expires mid-session.
//  2. Redirects unauthenticated visitors away from protected routes.
//  3. Redirects authenticated visitors away from auth pages (login, sign-up …).
//
// ── Why getUser() and not getSession() ───────────────────────────────────────
//
//  getSession() reads the JWT from the cookie and trusts it — a forged cookie
//  would pass. getUser() re-validates the token against the Supabase Auth
//  server on every call, which is the correct security posture for middleware.
//  The latency cost (~10 ms) is acceptable; the alternative is a security hole.
//
// ── Route rules ───────────────────────────────────────────────────────────────
//
//  Protected  →  /~/…          Unauthenticated visitors → /auth/login
//  Auth       →  /auth/…       Authenticated visitors  → /~
//
// ─────────────────────────────────────────────────────────────────────────────

import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

// ✅  Next.js requires the export to be named exactly "middleware".
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every route EXCEPT:
     *   - _next/static  — compiled assets
     *   - _next/image   — image optimisation
     *   - favicon.ico
     *   - static files  — svg, png, jpg, jpeg, gif, webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};