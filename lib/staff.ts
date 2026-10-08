import type { OpdStaff } from "@/types/database";

// Mirrors supabase/seed.sql. Used as a fallback so the form renders in local
// dev before Supabase is connected. Once env vars + DB exist, the real list
// (which the admin can edit) is used instead.
export const FALLBACK_STAFF: Pick<OpdStaff, "id" | "name_en" | "name_kn">[] = [
  { id: "seed-1", name_en: "Mr. Manju R", name_kn: "ಶ್ರೀ ಮಂಜು ಆರ್" },
  { id: "seed-2", name_en: "Mrs. Shanthi", name_kn: "ಶ್ರೀಮತಿ ಶಾಂತಿ" },
  { id: "seed-3", name_en: "Mrs. Sheela", name_kn: "ಶ್ರೀಮತಿ ಶೀಲಾ" },
  { id: "seed-4", name_en: "Mr. Chandru", name_kn: "ಶ್ರೀ ಚಂದ್ರು" },
  { id: "seed-5", name_en: "Mrs. Lavanya", name_kn: "ಶ್ರೀಮತಿ ಲಾವಣ್ಯ" },
  { id: "seed-6", name_en: "Ms. Kavana", name_kn: "ಕು. ಕವನ" },
  { id: "seed-7", name_en: "Mr. Manoj", name_kn: "ಶ್ರೀ ಮನೋಜ್" },
  { id: "seed-8", name_en: "Ms. Ashwini", name_kn: "ಕು. ಅಶ್ವಿನಿ" },
  { id: "seed-9", name_en: "Mrs. Shalini", name_kn: "ಶ್ರೀಮತಿ ಶಾಲಿನಿ" },
];

export type StaffOption = Pick<OpdStaff, "id" | "name_en" | "name_kn">;

export interface StaffRow {
  id: string;
  name_en: string;
  name_kn: string;
  is_active: boolean;
  sort_order: number;
}

/** All staff (active + inactive) for the admin management page. */
export async function getAllStaff(): Promise<{ live: boolean; rows: StaffRow[] }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      live: false,
      rows: FALLBACK_STAFF.map((s, i) => ({
        ...s,
        is_active: true,
        sort_order: i + 1,
      })),
    };
  }
  try {
    const { createServiceClient } = await import("./supabase/service");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("opd_staff")
      .select("id, name_en, name_kn, is_active, sort_order")
      .order("sort_order");
    if (error || !data) return { live: false, rows: [] };
    return { live: true, rows: data };
  } catch {
    return { live: false, rows: [] };
  }
}

/**
 * Active OPD staff for the form dropdown. Tries Supabase; falls back to the
 * seed list if env/DB is not configured yet (local dev before Phase 2 is run).
 */
export async function getActiveStaff(): Promise<StaffOption[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return FALLBACK_STAFF;
  }
  try {
    // Loaded server-side via the service client (the anon role can't read
    // opd_staff under RLS; the public form legitimately needs the active list).
    const { createServiceClient } = await import("./supabase/service");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("opd_staff")
      .select("id, name_en, name_kn")
      .eq("is_active", true)
      .order("sort_order");
    if (error || !data || data.length === 0) return FALLBACK_STAFF;
    return data;
  } catch {
    return FALLBACK_STAFF;
  }
}
