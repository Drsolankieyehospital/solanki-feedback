import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import type { AdminRole } from "@/types/database";

export interface AdminUserRow {
  user_id: string;
  full_name: string;
  role: AdminRole;
  email: string;
  created_at: string;
}

export async function getAdminUsers(): Promise<{
  live: boolean;
  rows: AdminUserRow[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      live: false,
      rows: [
        {
          user_id: "dev",
          full_name: "Dr. R. Solanki",
          role: "admin",
          email: "admin@drsolankieyehospital.com",
          created_at: new Date().toISOString(),
        },
        {
          user_id: "dev2",
          full_name: "Front Desk",
          role: "viewer",
          email: "frontdesk@drsolankieyehospital.com",
          created_at: new Date().toISOString(),
        },
      ],
    };
  }

  try {
    const supabase = createServiceClient();
    const [{ data: admins }, { data: authList }] = await Promise.all([
      supabase
        .from("admin_users")
        .select("user_id, full_name, role, created_at")
        .order("created_at"),
      supabase.auth.admin.listUsers(),
    ]);
    const emails = new Map(
      (authList?.users ?? []).map((u) => [u.id, u.email ?? ""]),
    );
    return {
      live: true,
      rows: (admins ?? []).map((a) => ({
        user_id: a.user_id,
        full_name: a.full_name,
        role: a.role,
        email: emails.get(a.user_id) ?? "",
        created_at: a.created_at,
      })),
    };
  } catch {
    return { live: false, rows: [] };
  }
}
