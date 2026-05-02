"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const userId = user.id;

  // Sign out first so the session is invalid before we delete the record
  await supabase.auth.signOut();

  // Remove application data (FK cascades should handle related rows,
  // but we delete explicitly to be safe)
  await supabase.from("cleaner_profiles").delete().eq("id", userId);
  await supabase.from("profiles").delete().eq("id", userId);

  // Hard-delete the auth user — requires service role
  await supabaseAdmin.auth.admin.deleteUser(userId);

  redirect("/");
}
