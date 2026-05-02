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

const STATUS_BADGE: Record<JobStatus, { dot: string; pill: string; label: string }> = {
  pending:   { dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600",                              label: "Pending"   },
  matched:   { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",          label: "Matched"   },
  confirmed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", label: "Confirmed" },
  completed: { dot: "bg-gray-300",    pill: "bg-gray-100 text-gray-500",                              label: "Completed" },
  cancelled: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 ring-1 ring-red-100",             label: "Cancelled" },
};

export default async function CleanerJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id, service_type, suburb, preferred_date, preferred_time, status,
      client:profiles!jobs_client_id_fkey ( full_name )
    `)
    .eq("cleaner_id", user.id)
    .in("status", ["matched", "confirmed", "completed"])
    .order("preferred_date", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">My jobs</h1>

      {jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => {
            const client = job.client as { full_name: string } | null;
            const clientFirst = client?.full_name?.split(" ")[0] ?? "Client";
            const s = STATUS_BADGE[job.status as JobStatus];
            return (
              <div key={job.id} className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {SERVICE_LABELS[job.service_type as ServiceType] ?? job.service_type}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {job.suburb} &middot; {formatDate(job.preferred_date)} &middot; {job.preferred_time}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">Client: {clientFirst}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <Link href={`/cleaner/jobs/${job.id}`} className="text-xs font-semibold text-gray-900 hover:underline">
                    View details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-gray-900">No jobs assigned yet.</p>
          <p className="mt-1.5 text-sm text-gray-400">
            Complete your profile to start receiving bookings.
          </p>
        </div>
      )}
    </div>
  );
}
