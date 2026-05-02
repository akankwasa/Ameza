import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import { MessageThread } from "@/components/shared/MessageThread";
import type { ServiceType, JobStatus } from "@/types/enums";

export async function generateStaticParams() { return []; }

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

function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 break-words">{value}</dd>
    </div>
  );
}

export default async function CleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select(
      `id, service_type, suburb, property_size,
       preferred_date, preferred_time,
       budget_min, budget_max, notes, status,
       client:profiles!jobs_client_id_fkey ( full_name )`
    )
    .eq("id", id)
    .eq("cleaner_id", user.id)
    .single();

  if (!job) notFound();

  const canMessage = (["matched", "confirmed", "completed"] as JobStatus[]).includes(
    job.status as JobStatus
  );

  const clientName = (job.client as unknown as { full_name: string } | null)?.full_name ?? null;
  const clientFirst = clientName?.split(" ")[0] ?? "Client";

  const budgetText = job.budget_min && job.budget_max
    ? `$${job.budget_min} – $${job.budget_max} AUD`
    : job.budget_min ? `From $${job.budget_min} AUD`
    : job.budget_max ? `Up to $${job.budget_max} AUD`
    : null;

  // Inline server action — marks job complete and returns to jobs list
  async function handleComplete() {
    "use server";
    const supa = await createClient();
    await supa.from("jobs").update({ status: "completed" }).eq("id", id);
    revalidatePath("/cleaner/jobs");
    redirect("/cleaner/jobs");
  }

  return (
    <div className="space-y-6">

      <Link
        href="/cleaner/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
        </svg>
        Back to my jobs
      </Link>

      {/* Job details */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {SERVICE_LABELS[job.service_type as ServiceType] ?? job.service_type}
          </h1>
          <StatusPill status={job.status as JobStatus} />
        </div>

        <dl className="mt-5">
          <DetailRow label="Client"   value={clientName ?? "—"} />
          <DetailRow label="Suburb"   value={job.suburb} />
          <DetailRow label="Property" value={job.property_size} />
          <DetailRow label="Date"     value={formatDate(job.preferred_date)} />
          <DetailRow label="Time"     value={job.preferred_time} />
          {budgetText && <DetailRow label="Budget" value={budgetText} />}
          {job.notes  && <DetailRow label="Notes"  value={job.notes} />}
        </dl>

        {job.status === "confirmed" && (
          <form action={handleComplete} className="mt-5 border-t border-gray-100 pt-5">
            <p className="mb-3 text-sm text-gray-500">Once you have finished the job, mark it as complete.</p>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Mark as complete
            </button>
          </form>
        )}
      </div>

      {canMessage && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Message {clientFirst}
          </h2>
          <MessageThread jobId={job.id} currentUserId={user.id} />
        </div>
      )}

    </div>
  );
}
