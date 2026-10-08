"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!authConfigured()) {
    return { error: "Sign-in is not available until Supabase is configured." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // One generic error for any failure (don't reveal which part was wrong).
  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  // Must be a registered admin, else sign back out.
  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account is not authorised for the admin panel." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}
