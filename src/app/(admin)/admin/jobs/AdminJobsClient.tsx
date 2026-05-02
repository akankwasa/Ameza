"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { assignCleaner } from "@/app/actions/jobs";
import { formatDate } from "@/lib/utils/format";
import type { ServiceType, JobStatus } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────

export type JobWithClient = {
  id: string;
  service_type: ServiceType;
  suburb: string;
  property_size: string;
  preferred_date: string;
  preferred_time: string;
  budget_min: number | null;
  budget_max: number | null;
  status: JobStatus;
  created_at: string;
  profiles: { full_name: string } | null;
};

type CleanerOption = {
  id: string;
  hourly_rate: number;
  rating_avg: number;
  profiles: { full_name: string } | null;
};

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
  pending:   { dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600",                              label: "Pending"   },
  matched:   { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",          label: "Matched"   },
  confirmed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", label: "Confirmed" },
  completed: { dot: "bg-gray-300",    pill: "bg-gray-100 text-gray-500",                              label: "Completed" },
  cancelled: { dot: "bg-red-400",     pill: "bg-red-50 text-red-600 ring-1 ring-red-100",             label: "Cancelled" },
};

const TABS: { label: string; value: JobStatus | "all" }[] = [
  { label: "All",       value: "all"       },
  { label: "Pending",   value: "pending"   },
  { label: "Matched",   value: "matched"   },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// ─── Small helpers ────────────────────────────────────────────────────────

function StatusPill({ status }: { status: JobStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Spinner({ cls = "h-4 w-4" }: { cls?: string }) {
  return (
    <svg className={`animate-spin ${cls}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function AdminJobsClient({ initialJobs }: { initialJobs: JobWithClient[] }) {
  const [jobs,            setJobs]            = useState(initialJobs);
  const [activeTab,       setActiveTab]       = useState<JobStatus | "all">("pending");
  const [openPanel,       setOpenPanel]       = useState<string | null>(null);
  const [panelCleaners,   setPanelCleaners]   = useState<CleanerOption[]>([]);
  const [fetchingCleaners, setFetchingCleaners] = useState(false);
  const [assigning,       setAssigning]       = useState<string | null>(null);
  const [assignError,     setAssignError]     = useState<string | null>(null);

  // Per-tab counts from full (unfiltered) list
  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = t.value === "all"
      ? jobs.length
      : jobs.filter((j) => j.status === t.value).length;
    return acc;
  }, {});

  const filtered = activeTab === "all" ? jobs : jobs.filter((j) => j.status === activeTab);

  // ── Assign panel ────────────────────────────────────────────────────

  async function toggleAssignPanel(job: JobWithClient) {
    if (openPanel === job.id) {
      setOpenPanel(null);
      return;
    }
    setOpenPanel(job.id);
    setPanelCleaners([]);
    setAssignError(null);
    setFetchingCleaners(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("cleaner_profiles")
      .select("id, hourly_rate, rating_avg, profiles ( full_name )")
      .eq("is_verified", true)
      .contains("coverage_suburbs", [job.suburb])
      .order("rating_avg", { ascending: false });

    setPanelCleaners((data as CleanerOption[] | null) ?? []);
    setFetchingCleaners(false);
  }

  async function handleAssign(jobId: string, cleanerId: string) {
    setAssigning(cleanerId);
    setAssignError(null);
    try {
      await assignCleaner(jobId, cleanerId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "matched" as JobStatus } : j))
      );
      setOpenPanel(null);
    } catch {
      setAssignError("Assignment failed. Please try again.");
    } finally {
      setAssigning(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Job queue</h1>
          <p className="mt-1 text-sm text-gray-500">{jobs.length} total jobs</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-gray-200/60 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span className={`rounded-full px-1.5 py-px text-xs font-semibold ${
                    active ? "bg-gray-100 text-gray-700" : "text-gray-400"
                  }`}>
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-sm text-gray-400">
              No {activeTab === "all" ? "" : activeTab} jobs found.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((job) => {
              const isPending   = job.status === "pending";
              const panelOpen   = openPanel === job.id;
              const budgetText  = job.budget_min && job.budget_max
                ? `$${job.budget_min} – $${job.budget_max} AUD`
                : job.budget_min  ? `From $${job.budget_min} AUD`
                : job.budget_max  ? `Up to $${job.budget_max} AUD`
                : null;

              return (
                <div key={job.id}>
                  {/* ── Job card ─────────────────────────────────── */}
                  <div className={`rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-shadow ${panelOpen ? "shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {SERVICE_LABELS[job.service_type] ?? job.service_type}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {job.suburb} &middot; {job.property_size} &middot;{" "}
                          {formatDate(job.preferred_date)} &middot; {job.preferred_time}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Client: <span className="font-medium text-gray-700">{job.profiles?.full_name ?? "—"}</span>
                          {budgetText && (
                            <span className="ml-3 text-gray-400">{budgetText}</span>
                          )}
                        </p>
                      </div>
                      <StatusPill status={job.status} />
                    </div>

                    {isPending && (
                      <div className="mt-4 flex justify-end border-t border-gray-100 pt-3.5">
                        <button
                          onClick={() => toggleAssignPanel(job)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
                        >
                          Assign cleaner
                          <IconChevron open={panelOpen} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Assign panel ──────────────────────────────── */}
                  {panelOpen && (
                    <div className="mx-3 rounded-b-2xl border border-t-0 border-gray-100 bg-white px-5 pb-5 pt-4 shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Verified cleaners in {job.suburb}
                      </p>

                      {fetchingCleaners ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                          <Spinner /> Loading cleaners…
                        </div>
                      ) : panelCleaners.length === 0 ? (
                        <p className="py-4 text-sm text-gray-400">
                          No verified cleaners found covering {job.suburb}.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {panelCleaners.map((cleaner) => (
                            <div
                              key={cleaner.id}
                              className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {cleaner.profiles?.full_name ?? "Unknown"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {cleaner.rating_avg > 0
                                    ? `★ ${cleaner.rating_avg.toFixed(1)}`
                                    : "No reviews"}
                                  {" · "}${cleaner.hourly_rate}/hr
                                </p>
                              </div>
                              <button
                                onClick={() => handleAssign(job.id, cleaner.id)}
                                disabled={assigning !== null}
                                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigning === cleaner.id ? (
                                  <><Spinner cls="h-3 w-3" /> Assigning…</>
                                ) : (
                                  "Assign"
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {assignError && (
                        <p className="mt-3 text-xs text-red-600">{assignError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
