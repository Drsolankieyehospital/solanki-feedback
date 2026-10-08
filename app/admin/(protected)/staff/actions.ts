"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { isAdminRole } from "@/lib/auth";

export interface StaffActionState {
  ok?: boolean;
  error?: string;
}

const NEEDS_SUPABASE = "Connect Supabase to edit staff.";

export async function addStaff(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  if (!(await isAdminRole())) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: NEEDS_SUPABASE };

  const name_en = String(formData.get("name_en") ?? "").trim();
  const name_kn = String(formData.get("name_kn") ?? "").trim();
  if (!name_en || !name_kn) return { error: "Both names are required." };

  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("opd_staff")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("opd_staff")
    .insert({ name_en, name_kn, sort_order: (max?.sort_order ?? 0) + 1 });
  if (error) return { error: "Could not add staff." };

  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function saveStaff(
  id: string,
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  if (!(await isAdminRole())) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: NEEDS_SUPABASE };

  const name_en = String(formData.get("name_en") ?? "").trim();
  const name_kn = String(formData.get("name_kn") ?? "").trim();
  const is_active = formData.get("is_active") === "on";
  if (!name_en || !name_kn) return { error: "Both names are required." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("opd_staff")
    .update({ name_en, name_kn, is_active })
    .eq("id", id);
  if (error) return { error: "Could not save." };

  revalidatePath("/admin/staff");
  return { ok: true };
}
