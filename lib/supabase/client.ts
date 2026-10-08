import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client (anon key).
 *
 * RULE: the browser NEVER writes patient data to Supabase directly.
 * The public form posts to /api/feedback (service role, server-side).
 * This client is used only for admin pages reading through the logged-in
 * user's session, where Row Level Security restricts rows to admins.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
