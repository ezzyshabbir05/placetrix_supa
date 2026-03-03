import { getUserProfile } from "@/lib/supabase/profile";
import { Header } from "@/components/header";

/**
 * Server component wrapper — fetches user profile and passes it to
 * the client-side <Header />. Drop this into your root layout instead
 * of <Header /> directly.
 */
export async function HeaderWrapper() {
  const user = await getUserProfile();
  return <Header user={user} />;
}