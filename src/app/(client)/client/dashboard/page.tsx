import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { ServiceType, JobStatus } from "@/types/enums";

// ─── Display maps ─────────────────────────────────────────────────────────

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
  pending:   { dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600",                            label: "Pending"   },
  matched:   { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",        label: "Matched"   },
  confirmed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", label: "Confirmed" },
  completed: { dot: "bg-gray-300",    pill: "bg-gray-100 text-gray-500",                            label: "Completed" },
  cancelled: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 ring-1 ring-red-100",           label: "Cancelled" },
};

// ─── Sub-components ───────────────────────────────────────────────────────

type JobRow = {
  id: string;
  service_type: ServiceType;
  suburb: string;
  preferred_date: string;
  preferred_time: string;
  status: JobStatus;
};

function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function JobCard({ job, showLink }: { job: JobRow; showLink: boolean }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {SERVICE_LABELS[job.service_type] ?? job.service_type}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {job.suburb} &middot; {formatDate(job.preferred_date)} &middot; {job.preferred_time}
          </p>
        </div>
        <StatusPill status={job.status} />
      </div>
      {showLink && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <Link
            href={`/client/jobs/${job.id}`}
            className="text-xs font-semibold text-gray-900 hover:underline"
          >
            View details →
          </Link>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-base font-semibold text-gray-900">{children}</h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function ClientDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: activeJobs }, { data: completedJobs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single(),

      supabase
        .from("jobs")
        .select("id, service_type, suburb, preferred_date, preferred_time, status")
        .eq("client_id", user.id)
        .in("status", ["pending", "matched", "confirmed"])
        .order("preferred_date", { ascending: true }),

      supabase
        .from("jobs")
        .select("id, service_type, suburb, preferred_date, preferred_time, status")
        .eq("client_id", user.id)
        .eq("status", "completed")
        .order("preferred_date", { ascending: false }),
    ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const completed = completedJobs ?? [];

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Welcome header ──────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your cleaning jobs and bookings.
          </p>
        </div>

        {/* ── Post a new job CTA ───────────────────────────────────── */}
        <div className="rounded-2xl bg-gray-900 px-6 py-6">
          <p className="text-base font-semibold text-white">Need something cleaned?</p>
          <p className="mt-1 text-sm text-gray-400">
            Post a job and get matched with a verified cleaner near you.
          </p>
          <Link
            href="/client/post-job"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Post a new job
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* ── Active jobs ──────────────────────────────────────────── */}
        <div>
          <SectionHeading>Active jobs</SectionHeading>

          {activeJobs && activeJobs.length > 0 ? (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job as JobRow} showLink />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-14 text-center">
              <p className="text-sm font-semibold text-gray-900">No active jobs</p>
              <p className="mt-1.5 text-sm text-gray-500">
                Post your first job to get matched with a cleaner.
              </p>
              <Link
                href="/client/post-job"
                className="mt-5 inline-block rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Post a job
              </Link>
            </div>
          )}
        </div>

        {/* ── Completed jobs (collapsible) ─────────────────────────── */}
        {completed.length > 0 && (
          <details className="group rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-semibold text-gray-900">
                Completed jobs
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {completed.length}
                </span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
              >
                <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </summary>

            <div className="space-y-3 border-t border-gray-100 px-5 pb-5 pt-4">
              {completed.map((job) => (
                <JobCard key={job.id} job={job as JobRow} showLink={false} />
              ))}
            </div>
          </details>
        )}

      </div>
    </div>
  );
}
