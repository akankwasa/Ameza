import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { ServiceType } from "@/types/enums";

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

// Placeholder: 3 hours per job until actual hours are tracked
const PLACEHOLDER_HOURS = 3;

export default async function CleanerEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cleanerProfile }, { data: jobs }] = await Promise.all([
    supabase
      .from("cleaner_profiles")
      .select("hourly_rate")
      .eq("id", user.id)
      .single(),
    supabase
      .from("jobs")
      .select("id, service_type, suburb, preferred_date, status")
      .eq("cleaner_id", user.id)
      .eq("status", "completed")
      .order("preferred_date", { ascending: false }),
  ]);

  const hourlyRate    = cleanerProfile?.hourly_rate ?? 0;
  const earnedPerJob  = hourlyRate * PLACEHOLDER_HOURS;
  const completedJobs = jobs ?? [];
  const totalEarned   = completedJobs.length * earnedPerJob;

  // "This month" earnings
  const now           = new Date();
  const thisMonth     = completedJobs.filter(j => {
    const d = new Date(j.preferred_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthEarned   = thisMonth.length * earnedPerJob;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Earnings</h1>
        <p className="mt-1 text-sm text-gray-500">Based on ${hourlyRate}/hr × {PLACEHOLDER_HOURS} hrs per job.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total earned</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            ${totalEarned.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-400">{completedJobs.length} completed job{completedJobs.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">This month</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            ${monthEarned.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-400">{thisMonth.length} job{thisMonth.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Job breakdown */}
      {completedJobs.length > 0 ? (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Completed jobs</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            {completedJobs.map((job, i) => (
              <div
                key={job.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 ${i < completedJobs.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {SERVICE_LABELS[job.service_type as ServiceType] ?? job.service_type}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {job.suburb} &middot; {formatDate(job.preferred_date)}
                  </p>
                </div>
                <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                  ${earnedPerJob.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">No completed jobs yet.</p>
        </div>
      )}

      {/* Stripe notice */}
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-400">
        Stripe payouts coming soon. Earnings shown are estimates based on a {PLACEHOLDER_HOURS}-hour placeholder until actual job durations are tracked.
      </p>
    </div>
  );
}
