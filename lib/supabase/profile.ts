import { redirect } from "next/navigation";
import { AuthApiError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AccountType = "candidate" | "institute" | "admin" | "recruiter";

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_path: string | null;
  username: string | null;
  account_type: AccountType;
}

// ─── Session revocation codes ──────────────────────────────────────────────────

const REVOKED_SESSION_CODES = new Set([
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "invalid_refresh_token",
  "user_not_found",
  "user_banned",
]);

function isDefinitiveRevocation(error: AuthApiError): boolean {
  if (error.code && REVOKED_SESSION_CODES.has(error.code)) return true;

  // Fallback heuristic for Supabase servers that omit `code`.
  return (
    error.status === 401 &&
    /session[_\s]not[_\s]found|invalid[_\s]refresh[_\s]token/i.test(
      error.message ?? "",
    )
  );
}

// ─── Fallback profile builders ─────────────────────────────────────────────────

/**
 * Builds a minimal UserProfile from standard JWT claims — no network call.
 * Used when Supabase Auth is unreachable but a valid local JWT exists.
 */
async function profileFromClaims(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<UserProfile | null> {
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const { sub, email, user_metadata: meta = {} } = data.claims as {
    sub: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };

  return {
    id: sub,
    email: email ?? "",
    display_name: (meta.full_name as string)
      ?? (meta.name as string)
      ?? email
      ?? "User",
    avatar_path: (meta.avatar_url as string) ?? null,
    username: null,           // not in standard JWT claims
    account_type: "candidate",    // safe offline default
  };
}

/**
 * Builds a minimal UserProfile from the auth `user` object (no DB query).
 * Used when the session is valid but the DB profile row is unreachable.
 */
function profileFromAuthUser(
  user: NonNullable<
    Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]
  >,
): UserProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? "",
    display_name: (meta.full_name as string)
      ?? (meta.name as string)
      ?? user.email
      ?? "User",
    avatar_path: (meta.avatar_url as string) ?? null,
    username: null,
    account_type: "candidate",
  };
}

// ─── getUserProfile ────────────────────────────────────────────────────────────
//
//  Resolution order:
//
//  1. getSession() reads the already-validated cookie (no network call).
//     Middleware has already run getUser() once per request, so the session
//     cookie is fresh. This avoids a second Auth DB hit per server component.
//     Session user found → fetch DB profile → return full profile.
//                          DB unreachable   → return auth-user fallback.
//  2. No session / AuthApiError that IS a definitive revocation
//     → sign out locally + redirect to login.
//  3. Transient AuthApiError or no session → try local JWT (step 4).
//  4. getClaims() succeeds → return minimal offline profile.
//     getClaims() fails    → JWT absent/expired → return null.
//                            (Middleware already blocked unauthenticated access.)
// ──────────────────────────────────────────────────────────────────────────────

export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  // ── Step 1: Read session from core cookie (no network call) ───────────────
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    // Optimization: Check for profile data in user_metadata first (JWT claims)
    const meta = user.user_metadata ?? {};
    if (meta.display_name && meta.account_type) {
      return {
        id: user.id,
        display_name: meta.display_name as string,
        email: user.email ?? "",
        account_type: meta.account_type as AccountType,
        avatar_path: (meta.avatar_path as string) ?? null,
        username: (meta.username as string) ?? null,
      };
    }

    // Fallback: If metadata is absent or stale, fetch from DB
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("id, display_name, email, account_type, avatar_path, username")
      .eq("id", user.id)
      .single();

    if (dbError || !profile) {
      return profileFromAuthUser(user);
    }

    return profile as UserProfile;
  }

  // ── Step 2 & 3: Handle definitive revocation (e.g. 401) ─────────────────
  if (authError instanceof AuthApiError) {
    if (isDefinitiveRevocation(authError)) {
      await supabase.auth.signOut({ scope: "local" });
      redirect("/auth/login");
    }
  }

  // ── Step 4: Offline / local-only — try local JWT claims ──────────────────
  return profileFromClaims(supabase);
});

