import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase"; // optional but recommended

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a singleton browser Supabase client.
 * Safe to call repeatedly — only one instance is created per page load.
 */
export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
}
