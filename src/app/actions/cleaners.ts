"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function approveCleaner(cleanerId: string) {
  await supabaseAdmin.from("cleaner_profiles").update({ is_verified: true }).eq("id", cleanerId);
  revalidatePath("/admin/cleaners");
}

export async function rejectCleaner(cleanerId: string, _reason: string) {
  // Remove the application so the cleaner can resubmit after fixing their docs.
  // The auth account is preserved — they can re-enter onboarding.
  await supabaseAdmin.from("cleaner_profiles").delete().eq("id", cleanerId);
  revalidatePath("/admin/cleaners");
}

export async function saveCleanerProfile(formData: FormData) {
  // Upserts cleaner_profiles row for the current user
}
