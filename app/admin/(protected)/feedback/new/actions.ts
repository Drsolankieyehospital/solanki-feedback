"use server";

import { redirect } from "next/navigation";
import { feedbackSchema } from "@/lib/validation/feedback";
import { QUESTIONS } from "@/lib/questions";
import { getAdmin } from "@/lib/auth";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";

export interface ManualState {
  ok?: boolean;
  error?: string;
}

const STAR_FIELDS = QUESTIONS.filter((q) => q.type === "star").map((q) => q.field);

export async function createManualFeedback(
  _prev: ManualState,
  formData: FormData,
): Promise<ManualState> {
  const admin = await getAdmin();
  if (!admin) return { error: "Not authorised." };

  const raw: Record<string, unknown> = {
    patient_name: formData.get("patient_name"),
    mrd_number: formData.get("mrd_number"),
    mobile: formData.get("mobile"),
    visit_date: formData.get("visit_date"),
    opd_staff_id: formData.get("opd_staff_id"),
    consultant_info: formData.get("consultant_info"),
    staff_helpful: formData.get("staff_helpful"),
    would_recommend: formData.get("would_recommend"),
    employee_recognition: formData.get("employee_recognition") ?? "",
    suggestions: formData.get("suggestions") ?? "",
    language: "en",
    source: "paper",
  };
  for (const f of STAR_FIELDS) raw[f] = Number(formData.get(f));

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: `Please check the form (${first ?? "invalid input"}).` };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase to save paper entries." };
  }

  const supabase = createServiceClient();
  const { data: staff } = await supabase
    .from("opd_staff")
    .select("id")
    .eq("id", parsed.data.opd_staff_id)
    .maybeSingle();
  if (!staff) return { error: "Select a valid OPD staff member." };

  const { error } = await supabase.from("feedback").insert({
    ...parsed.data,
    employee_recognition: parsed.data.employee_recognition || null,
    suggestions: parsed.data.suggestions || null,
  });
  if (error) return { error: "Could not save." };

  redirect("/admin/feedback");
}
