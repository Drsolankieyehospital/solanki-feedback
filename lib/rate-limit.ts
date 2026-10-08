import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 5;

/** sha256(ip + salt) — we never store raw IPs, only this hash. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "dev-salt-change-me";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

/** Pull the client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

/** True if this IP hash is under the submission limit (no extra service used). */
export async function withinRateLimit(
  supabase: SupabaseClient<Database>,
  ipHash: string,
): Promise<boolean> {
  const since = new Date(
    Date.now() - WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { count, error } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) return true; // fail open on count error (don't block real patients)
  return (count ?? 0) < MAX_PER_WINDOW;
}
