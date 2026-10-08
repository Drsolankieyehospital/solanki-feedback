import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * SERVICE-ROLE client — bypasses Row Level Security.
 *
 * SERVER ONLY. Never import this into a Client Component or anything that
 * ships to the browser. Used by /api/feedback to insert validated submissions
 * and by export/backup routes. The key must only ever live in a server-side
 * env var (SUPABASE_SERVICE_ROLE_KEY), never NEXT_PUBLIC_*.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase service credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
