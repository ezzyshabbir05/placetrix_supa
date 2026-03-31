// middleware.ts  (root of project — next to package.json)
//
// ── What this file does ────────────────────────────────────────────────────────
//
//  1. Refreshes the Supabase session cookie on every request so it never
//     silently expires mid-session.
//  2. Redirects unauthenticated visitors away from protected routes.
//  3. Redirects authenticated visitors away from auth pages (login, sign-up …).
//
// ── Why getSession() instead of getUser() ────────────────────────────────────
//
//  Initially, we used getUser() here to re-validate the token against the 
//  Supabase Auth server on every quest for maximum security—however, that
//  pattern results in "Auth request flooding" and 504 Gateway errors under load.
//  getSession() matches the token against the cookie faster and with zero latency.
//  We rely on Server Components/Actions to perform the final, hardened 
//  getUser() check for data consistency and account status security.
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
     * Only run middleware for:
     *   - Protected app routes ( /~/* )
     *   - Authentication routes ( /auth/* )
     */
    '/~/:path*',
    '/auth/:path*',
  ],
};
