import { redirect } from "next/navigation"
import { AuthApiError } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { cache } from "react"

export type AccountType = "candidate" | "institute" | "admin" | "recruiter"

export interface UserProfile {
  id: string
  display_name: string
  email: string
  avatar_path: string | null
  username: string | null
  account_type: AccountType
}

// ─── Error classification ──────────────────────────────────────────────────────
//
// These are the ONLY Supabase error codes that conclusively mean the session
// has been actively revoked server-side. Everything else (network timeouts,
// transient 401s from proxies/CDNs, DNS failures, etc.) should be treated as
// an offline/unreachable scenario and fall back to the local JWT instead.
//
// DO NOT add generic HTTP status codes here — a 401 can come from many sources
// that have nothing to do with session revocation.
// ──────────────────────────────────────────────────────────────────────────────

const REVOKED_SESSION_CODES = new Set([
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "invalid_refresh_token",
  "user_not_found",
  "user_banned",
])

function isDefinitiveRevocation(error: AuthApiError): boolean {
  // Code-based check — most reliable
  if (error.code && REVOKED_SESSION_CODES.has(error.code)) return true

  // Fallback: status + message heuristic for Supabase servers that omit `code`
  if (
    error.status === 401 &&
    typeof error.message === "string" &&
    /session[_\s]not[_\s]found|invalid[_\s]refresh[_\s]token/i.test(error.message)
  ) {
    return true
  }

  return false
}

// ─── Offline profile builder ───────────────────────────────────────────────────
//
// Decodes the locally-cached JWT (no network) and builds a minimal UserProfile
// from standard claims. Called whenever we cannot reach the Supabase API.
// ──────────────────────────────────────────────────────────────────────────────

async function offlineProfileFromClaims(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<UserProfile | null> {
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return null

  const c    = claimsData.claims
  const meta = (c.user_metadata ?? {}) as Record<string, unknown>

  // OAuth providers (Google, GitHub …) populate full_name / avatar_url in
  // user_metadata automatically. username and account_type are app-level fields
  // that live in the DB, not the JWT → safe offline defaults are used instead.
  return {
    id:           c.sub as string,
    email:        (c.email as string)                              ?? "",
    display_name: (meta.full_name  as string)
               ?? (meta.name       as string)
               ?? (c.email         as string)
               ?? "User",
    avatar_path:  (meta.avatar_url as string) ?? null,
    username:     null,            // not in standard JWT
    account_type: "candidate",     // safe offline default
  }
}

// ─── getUserProfile ────────────────────────────────────────────────────────────
//
// Resolution order:
//
//   1. getUser() succeeds (online, valid session)
//      → fetch full DB profile and return it.
//
//   2. getUser() fails with AuthApiError that is a DEFINITIVE revocation
//      → session was actively invalidated server-side.
//         Sign out locally and redirect to login.
//
//   3. getUser() fails with AuthApiError that is NOT a definitive revocation
//      → treat as "server unreachable / transient error".
//         Fall through to step 5 (local JWT fallback).
//
//   4. getUser() fails with any other error class
//      (AuthRetryableFetchError, TypeError, NetworkError, …)
//      → definitely offline or DNS failure.
//         Fall through to step 5.
//
//   5. getClaims() succeeds  → return minimal offline profile (no redirect).
//      getClaims() fails     → JWT absent or expired → return null (no redirect;
//                              middleware already blocked the protected route).
//
// The middleware uses getClaims() (local, no network) so it will have already
// redirected unauthenticated users before this function is reached on any
// protected route. Returning null here is therefore safe — it will render
// loading skeletons without a forced sign-out loop.
// ──────────────────────────────────────────────────────────────────────────────

export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // ── 1. Online + valid session ──────────────────────────────────────────────
  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, account_type, avatar_path, username")
      .eq("id", user.id)
      .single()

    if (error || !profile) {
      // DB is unreachable even though auth succeeded (e.g. DB cold-start).
      // Fall back to a minimal profile built from auth user fields rather than
      // returning null and causing a blank render.
      return {
        id:           user.id,
        email:        user.email ?? "",
        display_name: (user.user_metadata?.full_name as string)
                   ?? (user.user_metadata?.name       as string)
                   ?? user.email
                   ?? "User",
        avatar_path:  (user.user_metadata?.avatar_url as string) ?? null,
        username:     null,
        account_type: "candidate",
      }
    }

    return profile as UserProfile
  }

  // ── 2 & 3. AuthApiError ────────────────────────────────────────────────────
  if (authError instanceof AuthApiError) {
    if (isDefinitiveRevocation(authError)) {
      // Session was actively revoked server-side — force re-authentication.
      await supabase.auth.signOut({ scope: "local" })
      redirect("/auth/login")
    }

    // Any other AuthApiError (transient 5xx, CDN 401, rate limit, …) —
    // do NOT sign out. Treat as unreachable and try the local JWT.
  }

  // ── 4 & 5. Network failure or ambiguous error — use local JWT ──────────────
  return offlineProfileFromClaims(supabase)
})