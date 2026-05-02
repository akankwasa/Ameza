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

type JobRow = { id: string; service_type: ServiceType; suburb: string; preferred_date: string; preferred_time: string; status: JobStatus };

function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function JobCard({ job }: { job: JobRow }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{SERVICE_LABELS[job.service_type] ?? job.service_type}</p>
          <p className="mt-0.5 text-xs text-gray-500">{job.suburb} &middot; {formatDate(job.preferred_date)} &middot; {job.preferred_time}</p>
        </div>
        <StatusPill status={job.status} />
      </div>
      <div className="mt-4 border-t border-gray-100 pt-3">
        <Link href={`/client/jobs/${job.id}`} className="text-xs font-semibold text-gray-900 hover:underline">
          View details →
        </Link>
      </div>
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default async function ClientJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, service_type, suburb, preferred_date, preferred_time, status")
    .eq("client_id", user.id)
    .order("preferred_date", { ascending: false });

  const all      = (jobs ?? []) as JobRow[];
  const active   = all.filter(j => ["pending", "matched", "confirmed"].includes(j.status));
  const history  = all.filter(j => ["completed", "cancelled"].includes(j.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My jobs</h1>
        <Link href="/client/post-job" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
          + Post a job
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Active</h2>
        {active.length > 0
          ? <div className="space-y-3">{active.map(j => <JobCard key={j.id} job={j} />)}</div>
          : <EmptySection message="No active jobs. Post your first job to get matched with a cleaner." />}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">History</h2>
          <div className="space-y-3">{history.map(j => <JobCard key={j.id} job={j} />)}</div>
        </section>
      )}
    </div>
  );
}
