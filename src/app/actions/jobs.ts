"use server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendJobPostedNotification, sendJobMatchedClient, sendJobMatchedCleaner, sendReviewRequest } from "@/lib/email";
import { revalidatePath } from "next/cache";

// PHASE 1 MANUAL MATCHING ACTION
// This is the single most important function in the whole app at launch.
// Admin calls this from /admin/jobs after selecting a cleaner from the dropdown.
// Phase 2: this gets replaced by the supabase/functions/assign-cleaner Edge Function.
// The data model does NOT change between Phase 1 and Phase 2 -- only who calls this logic changes.
export async function assignCleaner(jobId: string, cleanerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ cleaner_id: cleanerId, status: "matched" })
    .eq("id", jobId);

  if (error) throw new Error(error.message);

  // Fetch emails for notifications
  const { data: job } = await supabase.from("jobs").select("*, profiles!jobs_client_id_fkey(*)").eq("id", jobId).single();
  const { data: cleaner } = await supabase.from("profiles").select("*").eq("id", cleanerId).single();

  if (job?.profiles?.email) await sendJobMatchedClient(job.profiles.email, jobId);
  if (cleaner?.email) await sendJobMatchedCleaner(cleaner.email, jobId);

  revalidatePath("/admin/jobs");
}

export async function postJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Insert job, then notify admin
  const { data: job, error } = await supabase.from("jobs").insert({
    client_id: user.id,
    service_type: formData.get("service_type"),
    suburb: formData.get("suburb"),
    property_size: formData.get("property_size"),
    preferred_date: formData.get("preferred_date"),
    preferred_time: formData.get("preferred_time"),
    budget_min: formData.get("budget_min") || null,
    budget_max: formData.get("budget_max") || null,
    notes: formData.get("notes") || null,
    photo_urls: [],
    status: "pending",
  }).select().single();

  if (error) throw new Error(error.message);

  // TODO: replace with env var for admin email
  await sendJobPostedNotification("admin@yourdomain.com", job.id);

  return job.id;
}

export async function completeJob(jobId: string) {
  const supabase = await createClient();
  await supabase.from("jobs").update({ status: "completed" }).eq("id", jobId);

  // Send review request email to the client (non-blocking — don't fail the action if email fails)
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("client_id")
      .eq("id", jobId)
      .single();
    if (job?.client_id) {
      const { data: { user: clientUser } } = await supabaseAdmin.auth.admin.getUserById(job.client_id);
      if (clientUser?.email) await sendReviewRequest(clientUser.email, jobId);
    }
  } catch { /* email failure should not block completion */ }

  revalidatePath("/cleaner/jobs");
}

export async function cancelJob(jobId: string) {
  const supabase = await createClient();
  await supabase.from("jobs").update({ status: "cancelled" }).eq("id", jobId);
  revalidatePath("/client/dashboard");
}
