"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { authConfigured, getAdmin } from "@/lib/auth";
import type { FeedbackStatus } from "@/types/database";

const STATUSES: FeedbackStatus[] = ["new", "reviewed", "follow_up", "resolved"];

export interface UpdateState {
  ok?: boolean;
  error?: string;
}

export async function updateFeedback(
  id: string,
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const status = String(formData.get("status") ?? "") as FeedbackStatus;
  const notes = String(formData.get("admin_notes") ?? "").trim();

  if (!STATUSES.includes(status)) return { error: "Invalid status." };

  if (!authConfigured()) {
    // dev preview — pretend success
    return { ok: true };
  }

  const admin = await getAdmin();
  if (!admin) return { error: "Not authorised." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .update({
      status,
      admin_notes: notes || null,
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "Could not save changes." };

  revalidatePath(`/admin/feedback/${id}`);
  revalidatePath("/admin/feedback");
  return { ok: true };
}
