import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminJobsClient, type JobWithClient } from "./AdminJobsClient";

export default async function AdminJobsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `id, service_type, suburb, property_size,
       preferred_date, preferred_time,
       budget_min, budget_max, status, created_at,
       profiles!jobs_client_id_fkey ( full_name )`
    )
    .order("created_at", { ascending: false });

  return <AdminJobsClient initialJobs={(jobs ?? []) as unknown as JobWithClient[]} />;
}
