"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { isAdminRole } from "@/lib/auth";
import type { AdminRole } from "@/types/database";

export interface InviteState {
  ok?: boolean;
  error?: string;
}

export async function inviteUser(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  if (!(await isAdminRole())) return { error: "Admins only." };
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase to invite users." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = (String(formData.get("role") ?? "viewer") as AdminRole);
  if (!email || !full_name) return { error: "Name and email are required." };
  if (role !== "admin" && role !== "viewer") return { error: "Invalid role." };

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) {
    return { error: error?.message ?? "Could not send invite." };
  }

  const { error: insErr } = await supabase
    .from("admin_users")
    .upsert({ user_id: data.user.id, full_name, role });
  if (insErr) return { error: "Invited, but could not set role." };

  revalidatePath("/admin/users");
  return { ok: true };
}
