"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(jobId: string, revieweeId: string, rating: number, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("reviews").insert({ job_id: jobId, reviewer_id: user.id, reviewee_id: revieweeId, rating, body });

  // Update cleaner's rating_avg and rating_count
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("reviewee_id", revieweeId);
  if (reviews) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await supabase.from("cleaner_profiles").update({ rating_avg: avg, rating_count: reviews.length }).eq("id", revieweeId);
  }

  revalidatePath(`/client/jobs/${jobId}`);
}

export async function flagReview(reviewId: string) {
  // Admin action -- flag for moderation review
}
