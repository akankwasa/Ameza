"use server";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(jobId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("messages").insert({ job_id: jobId, sender_id: user.id, body });
  // No revalidatePath needed -- Realtime pushes to subscribers automatically
}
