"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/auth";

export async function signOut() {
  if (authConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
