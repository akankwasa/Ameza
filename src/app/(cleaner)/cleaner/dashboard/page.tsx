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
  pending:   { dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600",                       label: "Pending"   },
  matched:   { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",   label: "Matched"   },
  confirmed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", label: "Confirmed" },
  completed: { dot: "bg-gray-300",    pill: "bg-gray-100 text-gray-500",                       label: "Completed" },
  cancelled: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 ring-1 ring-red-100",      label: "Cancelled" },
};

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function JobCard({
  job,
}: {
  job: {
    id: string;
    service_type: ServiceType;
    suburb: string;
    preferred_date: string;
    preferred_time: string;
    status: JobStatus;
  };
}) {
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
      <div className="mt-4 border-t border-gray-100 pt-3">
        <Link
          href={`/cleaner/jobs/${job.id}`}
          className="text-xs font-semibold text-gray-900 hover:underline"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}

function EmptyJobs() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-14 text-center">
      <p className="text-sm font-semibold text-gray-900">No upcoming jobs yet</p>
      <p className="mt-1.5 text-sm text-gray-500">
        Complete your profile to start receiving bookings.
      </p>
      <Link
        href="/cleaner/profile"
        className="mt-5 inline-block rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Complete profile
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function CleanerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const { onboarding } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Parallel data fetches
  const [
    { data: profile },
    { data: cleanerProfile },
    { data: upcomingJobs },
    { count: completedCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),

    supabase
      .from("cleaner_profiles")
      .select("is_verified, rating_avg, rating_count")
      .eq("id", user.id)
      .single(),

    supabase
      .from("jobs")
      .select("id, service_type, suburb, preferred_date, preferred_time, status")
      .eq("cleaner_id", user.id)
      .in("status", ["matched", "confirmed"])
      .order("preferred_date", { ascending: true }),

    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("cleaner_id", user.id)
      .eq("status", "completed"),
  ]);

  // Redirect to onboarding if cleaner hasn't submitted their profile yet
  if (!cleanerProfile) redirect("/cleaner/onboarding");

  const firstName      = profile?.full_name?.split(" ")[0] ?? "there";
  const isVerified     = cleanerProfile.is_verified ?? false;
  const ratingAvg      = cleanerProfile.rating_avg ?? 0;
  const confirmedCount = upcomingJobs?.filter((j) => j.status === "confirmed").length ?? 0;

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Welcome header ──────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your Ameza activity.
          </p>
        </div>

        {/* ── Onboarding complete banner ───────────────────────────── */}
        {onboarding === "complete" && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            <span>Your profile has been submitted for review. We&apos;ll notify you once it&apos;s approved.</span>
          </div>
        )}

        {/* ── Verification banner ──────────────────────────────────── */}
        {isVerified ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            <span>Your profile is verified and visible to clients.</span>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span>Your profile is under review. We&apos;ll notify you once approved.</span>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Upcoming jobs"  value={confirmedCount} />
          <StatCard label="Completed jobs" value={completedCount ?? 0} />
          <StatCard
            label="Average rating"
            value={ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}
          />
        </div>

        {/* ── Upcoming jobs ────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Upcoming jobs</h2>
          {upcomingJobs && upcomingJobs.length > 0 ? (
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <JobCard key={job.id} job={job as Parameters<typeof JobCard>[0]["job"]} />
              ))}
            </div>
          ) : (
            <EmptyJobs />
          )}
        </div>

        {/* ── Quick links ──────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Quick links</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/cleaner/profile"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-colors hover:bg-gray-50"
            >
              Edit profile
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-gray-400">
                <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/cleaner/earnings"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-colors hover:bg-gray-50"
            >
              View earnings
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-gray-400">
                <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
