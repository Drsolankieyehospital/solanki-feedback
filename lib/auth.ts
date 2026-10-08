import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";

/** Auth needs the public Supabase URL + anon key (service role not required). */
export function authConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export interface AdminIdentity {
  userId: string;
  fullName: string;
  role: AdminRole;
  email?: string;
}

/**
 * The current admin, or null if not signed in / not an admin.
 *
 * Dev affordance: when Supabase isn't configured yet AND we're not in
 * production, returns a mock admin so the admin UI is previewable locally.
 * In production, no config → no access.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  if (!authConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return {
        userId: "dev",
        fullName: "Dev Admin",
        role: "admin",
        email: "dev@localhost",
      };
    }
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    userId: user.id,
    fullName: data.full_name,
    role: data.role,
    email: user.email ?? undefined,
  };
}

/** True if the current admin can perform admin-only actions (export, delete…). */
export async function isAdminRole(): Promise<boolean> {
  const admin = await getAdmin();
  return admin?.role === "admin";
}
