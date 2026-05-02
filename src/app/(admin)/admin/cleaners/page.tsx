import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminCleanersClient, type CleanerRow } from "./AdminCleanersClient";

export default async function AdminCleanersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cleaners } = await supabase
    .from("cleaner_profiles")
    .select(
      `id, is_verified, hourly_rate, services,
       id_doc_url, police_check_url, insurance_url, created_at,
       profiles ( full_name, avatar_url )`
    )
    .order("created_at", { ascending: false });

  return <AdminCleanersClient initialCleaners={(cleaners ?? []) as CleanerRow[]} />;
}
