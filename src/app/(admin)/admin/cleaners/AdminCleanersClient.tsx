"use client";

import { useState } from "react";
import { approveCleaner, rejectCleaner } from "@/app/actions/cleaners";
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

export type CleanerRow = {
  id: string;
  is_verified: boolean;
  hourly_rate: number;
  services: ServiceType[];
  id_doc_url: string | null;
  police_check_url: string | null;
  insurance_url: string | null;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="text-xs text-gray-300">{label}: —</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="text-xs font-medium text-blue-600 hover:underline">
      {label} ↗
    </a>
  );
}

function CleanerCard({ cleaner, onApproved }: { cleaner: CleanerRow; onApproved: (id: string) => void }) {
  const [approving,      setApproving]      = useState(false);
  const [rejectOpen,     setRejectOpen]     = useState(false);
  const [rejectReason,   setRejectReason]   = useState("");
  const [rejecting,      setRejecting]      = useState(false);
  const [rejected,       setRejected]       = useState(false);

  async function handleApprove() {
    setApproving(true);
    await approveCleaner(cleaner.id);
    onApproved(cleaner.id);
    setApproving(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    await rejectCleaner(cleaner.id, rejectReason.trim());
    setRejected(true);
    setRejectOpen(false);
    setRejecting(false);
  }

  const name = cleaner.profiles?.full_name ?? "Unknown";

  if (rejected) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
        <p className="text-sm font-medium text-red-700">{name} — marked as rejected</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            ${cleaner.hourly_rate}/hr &middot; {cleaner.services.length} service{cleaner.services.length !== 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {cleaner.services.slice(0, 3).map(s => SERVICE_LABELS[s] ?? s).join(", ")}
            {cleaner.services.length > 3 ? ` +${cleaner.services.length - 3} more` : ""}
          </p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${cleaner.is_verified ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"}`}>
          {cleaner.is_verified ? "Verified" : "Pending"}
        </span>
      </div>

      {/* Documents */}
      <div className="mt-3 flex flex-wrap gap-3">
        <DocLink url={cleaner.id_doc_url}       label="Gov ID" />
        <DocLink url={cleaner.police_check_url} label="Police check" />
        <DocLink url={cleaner.insurance_url}    label="Insurance" />
      </div>

      {/* Actions — only for pending cleaners */}
      {!cleaner.is_verified && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {!rejectOpen ? (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="rounded-lg bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {approving ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection…"
                className="block w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? "Rejecting…" : "Confirm reject"}
                </button>
                <button
                  onClick={() => { setRejectOpen(false); setRejectReason(""); }}
                  className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminCleanersClient({ initialCleaners }: { initialCleaners: CleanerRow[] }) {
  const [cleaners, setCleaners] = useState(initialCleaners);
  const [tab, setTab]           = useState<"pending" | "verified">("pending");

  function onApproved(id: string) {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, is_verified: true } : c));
  }

  const filtered = cleaners.filter(c => tab === "pending" ? !c.is_verified : c.is_verified);
  const pendingCount  = cleaners.filter(c => !c.is_verified).length;
  const verifiedCount = cleaners.filter(c => c.is_verified).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cleaners</h1>
        <p className="text-sm text-gray-500">{cleaners.length} total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-200/60 p-1 w-fit">
        {([["pending", pendingCount], ["verified", verifiedCount]] as const).map(([t, count]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-px text-xs font-semibold ${tab === t ? "bg-gray-100 text-gray-700" : "text-gray-400"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">No {tab} cleaners.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <CleanerCard key={c.id} cleaner={c} onApproved={onApproved} />
          ))}
        </div>
      )}
    </div>
  );
}
