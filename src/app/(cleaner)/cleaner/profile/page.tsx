"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/format";
import { deleteAccount } from "@/app/actions/account";
import { CoverageSelector } from "@/components/shared/LocationSelector";
import type { ServiceType } from "@/types/enums";

// ─── Constants ────────────────────────────────────────────────────────────

const SERVICES: { value: ServiceType; label: string }[] = [
  { value: "regular_domestic", label: "Regular domestic" },
  { value: "once_off",         label: "Once-off clean"  },
  { value: "end_of_lease",     label: "End of lease"    },
  { value: "carpet",           label: "Carpet cleaning" },
  { value: "commercial",       label: "Commercial"      },
  { value: "move_in",          label: "Move-in clean"   },
  { value: "window",           label: "Window cleaning" },
  { value: "pressure_wash",    label: "Pressure wash"   },
];

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIMES = ["Morning", "Afternoon", "Evening"] as const;

const INPUT = "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

// ─── Icons ────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function CleanerProfileEditPage() {
  const [bio,          setBio]          = useState("");
  const [hourlyRate,   setHourlyRate]   = useState("");
  const [services,     setServices]     = useState<ServiceType[]>([]);
  const [suburbs,      setSuburbs]      = useState<string[]>([]);
  const [suburbInput,  setSuburbInput]  = useState("");
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [slug,         setSlug]         = useState<string | null>(null);

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const router = useRouter();

  // ── Fetch current data on mount ──────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("cleaner_profiles")
        .select("bio, hourly_rate, services, coverage_suburbs, availability, slug")
        .eq("id", user.id)
        .single();
      if (data) {
        setBio(data.bio ?? "");
        setHourlyRate(String(data.hourly_rate ?? ""));
        setServices((data.services as ServiceType[]) ?? []);
        setSuburbs((data.coverage_suburbs as string[]) ?? []);
        setAvailability((data.availability as Record<string, string[]>) ?? {});
        setSlug(data.slug ?? null);
      }
      setLoading(false);
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleService(svc: ServiceType) {
    setServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  }

  function addSuburb() {
    const s = suburbInput.trim();
    if (s && !suburbs.includes(s)) setSuburbs(prev => [...prev, s]);
    setSuburbInput("");
  }

  function toggleSlot(day: string, time: string) {
    setAvailability(prev => {
      const cur = prev[day] ?? [];
      return { ...prev, [day]: cur.includes(time) ? cur.filter(t => t !== time) : [...cur, time] };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate < 20) { setError("Hourly rate must be at least $20."); return; }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired."); setSaving(false); return; }

    const { error: upsertErr } = await supabase.from("cleaner_profiles").upsert({
      id:               user.id,
      bio:              bio.trim() || null,
      hourly_rate:      rate,
      services,
      coverage_suburbs: suburbs,
      availability,
    });

    if (upsertErr) {
      setError(upsertErr.message);
      setSaving(false);
      return;
    }

    // Generate slug on first save (if not already set)
    if (!slug) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const newSlug = `${slugify(profileRow?.full_name ?? "cleaner")}-${user.id.slice(0, 6)}`;
      await supabase.from("cleaner_profiles").update({ slug: newSlug }).eq("id", user.id);
      setSlug(newSlug);
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    setSaving(false);
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-gray-400">
        <Spinner /> Loading profile…
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit profile</h1>
          <p className="mt-1 text-sm text-gray-500">Changes are visible to clients once saved.</p>
        </div>
        {slug && (
          <a
            href={`/cleaners/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Preview
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400">
              <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
            </svg>
          </a>
        )}
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-6">

        {/* Bio */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">About you</h2>
          <div>
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              rows={5}
              maxLength={300}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Describe your experience and what makes you great."
              className={`${INPUT} resize-none`}
            />
            <p className={`mt-1 text-right text-xs ${bio.length >= 280 ? "text-amber-500" : "text-gray-400"}`}>{bio.length}/300</p>
          </div>
        </div>

        {/* Rate */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Hourly rate (AUD)</h2>
          <div className="relative max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">$</span>
            <input
              type="number"
              min={20}
              step={5}
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              placeholder="45"
              className={`${INPUT} pl-7`}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Minimum $20/hr</p>
        </div>

        {/* Services */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Services offered</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SERVICES.map(({ value, label }) => {
              const on = services.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleService(value)}
                  className={`relative rounded-xl border-2 px-3 py-3.5 text-left text-sm font-medium transition-all ${
                    on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coverage suburbs */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Coverage suburbs</h2>
          <CoverageSelector suburbs={suburbs} onChange={setSuburbs} />
        </div>

        {/* Availability */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Availability</h2>
          <div className="overflow-x-auto">
            <div className="grid min-w-[300px] grid-cols-[3.5rem_1fr_1fr_1fr] gap-1.5">
              <div />
              {TIMES.map(t => (
                <div key={t} className="pb-1 text-center text-xs font-medium text-gray-500">{t}</div>
              ))}
              {DAYS.map(day => (
                <Fragment key={day}>
                  <div className="flex items-center text-xs font-medium text-gray-500">{day}</div>
                  {TIMES.map(time => {
                    const on = (availability[day] ?? []).includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => toggleSlot(day, time)}
                        className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                          on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {on ? "✓" : ""}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback + save */}
        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile saved successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <><Spinner />Saving…</> : "Save changes"}
        </button>
      </form>

      {/* ── Delete account ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-semibold text-gray-900">Delete account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Permanently removes your profile, documents, and account. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-medium text-red-700">Are you sure? This will delete everything permanently.</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await deleteAccount();
                  router.push("/");
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
