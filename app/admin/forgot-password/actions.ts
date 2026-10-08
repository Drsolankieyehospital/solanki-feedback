"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/auth";

export interface ResetState {
  error?: string;
  sent?: boolean;
}

export async function requestReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  if (!authConfigured()) {
    return { error: "Password reset is not available until Supabase is configured." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();

  // Always report success (don't reveal whether an email is registered).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/admin/login`,
  });

  return { sent: true };
}
