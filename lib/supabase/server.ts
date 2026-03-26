import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Creates a fresh server-side Supabase client per request.
 * Do NOT cache this in a module-level variable — each request needs its own
 * cookie context, especially with Next.js Fluid/Edge compute.
 *
 * autoRefreshToken and persistSession are disabled here intentionally.
 * Token refresh happens exactly once per request in middleware (proxy.ts)
 * via getUser(). Allowing server components to also auto-refresh would cause
 * concurrent refresh storms (409 errors) under load.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — cookies are read-only.
            // Safe to ignore if middleware is refreshing sessions.
          }
        },
      },
      auth: {
        autoRefreshToken: false, // Middleware handles the single refresh per request
        persistSession: false,   // Server has no persistent storage — don't try to save
      },
    },
  );
}
