import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { ServiceType, JobStatus } from "@/types/enums";

const SERVICE_LABELS: Record<ServiceType, string> = {
  regular_domestic: "Regular domestic",
  once_off:         "Once-off clean",
  end_of_lease:     "End of lease",
  carpet:           "Carpet cleaning",
  commercial:       "Commercial",
  move_in:          "Move-in clean",
  window:           "Window cleaning",
  pressure_wash:    "Pressure wash",
};

const STATUS_DOT: Record<JobStatus, string> = {
  pending:   "bg-gray-400",
  matched:   "bg-blue-500",
  confirmed: "bg-emerald-500",
  completed: "bg-gray-300",
  cancelled: "bg-red-400",
};

export default async function CleanerMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id, service_type, suburb, preferred_date, status,
      client:profiles!jobs_client_id_fkey ( full_name )
    `)
    .eq("cleaner_id", user.id)
    .in("status", ["matched", "confirmed", "completed"])
    .order("preferred_date", { ascending: false });

  const threads = (jobs ?? []) as unknown as {
    id: string;
    service_type: ServiceType;
    suburb: string;
    preferred_date: string;
    status: JobStatus;
    client: { full_name: string } | null;
  }[];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Messages</h1>

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-gray-900">No conversations yet.</p>
          <p className="mt-1.5 text-sm text-gray-400">
            Messages appear here once you are assigned to a job.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <Link
              key={thread.id}
              href={`/cleaner/jobs/${thread.id}`}
              className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.09)]"
            >
              <span className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATUS_DOT[thread.status]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {SERVICE_LABELS[thread.service_type] ?? thread.service_type}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {thread.suburb} &middot; {formatDate(thread.preferred_date)}
                  {thread.client && ` &middot; ${thread.client.full_name.split(" ")[0]}`}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-gray-300">
                <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
