"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/format";
import type { ServiceType } from "@/types/enums";

// ─── Constants ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Services", "Rates & Location", "Availability", "About you", "Documents"] as const;
const TOTAL_STEPS = STEP_LABELS.length;

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

// ─── Design tokens ────────────────────────────────────────────────────────

const BTN_PRIMARY =
  "flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_GHOST =
  "flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const INPUT =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

// ─── Icons ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconCheck({ cls = "h-3.5 w-3.5" }: { cls?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={cls}>
      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-gray-400">
      <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
    </svg>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────

function FileField({
  label,
  hint,
  accept,
  file,
  onChange,
}: {
  label: string;
  hint?: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="mb-2 text-xs text-gray-400">{hint}</p>}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3.5 transition hover:border-gray-400 hover:bg-gray-50">
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <IconUpload />
        <span className={`flex-1 truncate text-sm ${file ? "font-medium text-gray-900" : "text-gray-400"}`}>
          {file ? file.name : "Click to upload"}
        </span>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(null); }}
            className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Remove file"
          >
            <IconX />
          </button>
        )}
      </label>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEP_LABELS.map((_, idx) => {
          const n = idx + 1;
          const done   = step > n;
          const active = step === n;
          return (
            <Fragment key={n}>
              {idx > 0 && (
                <div className={`h-px flex-1 transition-colors duration-300 ${step > idx ? "bg-gray-900" : "bg-gray-200"}`} />
              )}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                  done || active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <IconCheck /> : n}
              </div>
            </Fragment>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Step {step} of {TOTAL_STEPS} —{" "}
        <span className="font-semibold text-gray-900">{STEP_LABELS[step - 1]}</span>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function CleanerOnboardingPage() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1
  const [services, setServices] = useState<ServiceType[]>([]);

  // Step 2
  const [hourlyRate, setHourlyRate] = useState("");
  const [suburbs, setSuburbs]       = useState<string[]>([]);
  const [suburbInput, setSuburbInput] = useState("");

  // Step 3
  const [availability, setAvailability] = useState<Record<string, string[]>>({});

  // Step 4
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [bio, setBio]                   = useState("");

  // Step 5
  const [idDoc,       setIdDoc]       = useState<File | null>(null);
  const [policeCheck, setPoliceCheck] = useState<File | null>(null);
  const [insurance,   setInsurance]   = useState<File | null>(null);
  const [confirmed,   setConfirmed]   = useState(false);

  // UI
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────

  function toggleService(svc: ServiceType) {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  }

  function addSuburb() {
    const s = suburbInput.trim();
    if (s && !suburbs.includes(s)) setSuburbs((prev) => [...prev, s]);
    setSuburbInput("");
  }

  function toggleSlot(day: string, time: string) {
    setAvailability((prev) => {
      const cur = prev[day] ?? [];
      return {
        ...prev,
        [day]: cur.includes(time) ? cur.filter((t) => t !== time) : [...cur, time],
      };
    });
  }

  function validate(): string | null {
    switch (step) {
      case 1:
        if (services.length === 0) return "Select at least one service to continue.";
        break;
      case 2: {
        const rate = parseFloat(hourlyRate);
        if (!hourlyRate || isNaN(rate) || rate < 20) return "Hourly rate must be at least $20.";
        if (suburbs.length === 0) return "Add at least one suburb you cover.";
        break;
      }
      case 3:
        if (!Object.values(availability).some((v) => v.length > 0))
          return "Select at least one available time slot.";
        break;
      case 5:
        if (!confirmed) return "Please confirm your documents are genuine and up to date.";
        break;
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    async function uploadFile(file: File | null, slot: string): Promise<string | null> {
      if (!file) return null;
      const ext  = file.name.split(".").pop() ?? "bin";
      const path = `${user!.id}/${slot}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("cleaner-docs")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      return supabase.storage.from("cleaner-docs").getPublicUrl(path).data.publicUrl;
    }

    let avatarUrl:      string | null = null;
    let idDocUrl:       string | null = null;
    let policeCheckUrl: string | null = null;
    let insuranceUrl:   string | null = null;

    try {
      [avatarUrl, idDocUrl, policeCheckUrl, insuranceUrl] = await Promise.all([
        uploadFile(profilePhoto, "avatar"),
        uploadFile(idDoc,        "id_doc"),
        uploadFile(policeCheck,  "police_check"),
        uploadFile(insurance,    "insurance"),
      ]);
    } catch {
      setError("File upload failed. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    if (avatarUrl) {
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    }

    const { error: upsertErr } = await supabase.from("cleaner_profiles").upsert({
      id:               user.id,
      services,
      hourly_rate:      parseFloat(hourlyRate),
      coverage_suburbs: suburbs,
      availability,
      bio:              bio.trim() || null,
      id_doc_url:       idDocUrl,
      police_check_url: policeCheckUrl,
      insurance_url:    insuranceUrl,
      is_verified:      false,
    });

    if (upsertErr) {
      setError(upsertErr.message);
      setLoading(false);
      return;
    }

    // Generate a unique slug from the cleaner's full name + short user ID
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const slug = `${slugify(profileRow?.full_name ?? "cleaner")}-${user.id.slice(0, 6)}`;
    await supabase.from("cleaner_profiles").update({ slug }).eq("id", user.id);

    router.push("/cleaner/dashboard?onboarding=complete");
  }

  // ── Step renderers ────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 1: Services ──────────────────────────────────────────────
      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">What services do you offer?</h2>
            <p className="mt-1 text-sm text-gray-500">Select all that apply — you can update this later.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {SERVICES.map(({ value, label }) => {
                const on = services.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleService(value)}
                    className={`relative rounded-xl border-2 px-3 py-3.5 text-left text-sm font-medium transition-all duration-150 ${
                      on
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {on && (
                      <span className="absolute right-2 top-2 text-white opacity-80">
                        <IconCheck cls="h-3 w-3" />
                      </span>
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        );

      // ── Step 2: Rates & location ──────────────────────────────────────
      case 2:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Your rates and coverage</h2>
            <p className="mt-1 text-sm text-gray-500">Clients see your hourly rate and the suburbs you service.</p>
            <div className="mt-6 space-y-5">
              {/* Hourly rate */}
              <div>
                <label htmlFor="rate" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Hourly rate (AUD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">
                    $
                  </span>
                  <input
                    id="rate"
                    type="number"
                    min={20}
                    step={5}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="45"
                    className={`${INPUT} pl-7`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Minimum $20 / hr</p>
              </div>

              {/* Suburbs tag input */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Suburbs you cover
                </label>
                <div className="rounded-xl border border-gray-200 px-3 py-2.5 transition focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10">
                  {suburbs.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {suburbs.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => setSuburbs((prev) => prev.filter((x) => x !== s))}
                            className="text-gray-400 hover:text-gray-700"
                            aria-label={`Remove ${s}`}
                          >
                            <IconX />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={suburbInput}
                    onChange={(e) => setSuburbInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSuburb(); } }}
                    placeholder="Type a suburb and press Enter"
                    className="w-full text-sm text-gray-900 placeholder-gray-400 outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Press Enter after each suburb name.</p>
              </div>
            </div>
          </>
        );

      // ── Step 3: Availability ──────────────────────────────────────────
      case 3:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">When are you available?</h2>
            <p className="mt-1 text-sm text-gray-500">Tap a cell to toggle. Select all slots that typically work for you.</p>
            <div className="mt-6 overflow-x-auto">
              <div className="grid min-w-[320px] grid-cols-[3.5rem_1fr_1fr_1fr] gap-1.5">
                {/* Header row */}
                <div />
                {TIMES.map((t) => (
                  <div key={t} className="pb-1 text-center text-xs font-medium text-gray-500">{t}</div>
                ))}
                {/* Day rows */}
                {DAYS.map((day) => (
                  <Fragment key={day}>
                    <div className="flex items-center text-xs font-medium text-gray-500">{day}</div>
                    {TIMES.map((time) => {
                      const on = (availability[day] ?? []).includes(time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleSlot(day, time)}
                          aria-pressed={on}
                          className={`h-9 rounded-lg border text-xs font-medium transition-all duration-150 ${
                            on
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500"
                          }`}
                        >
                          {on ? <span className="flex justify-center"><IconCheck /></span> : null}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </>
        );

      // ── Step 4: About ─────────────────────────────────────────────────
      case 4:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Tell clients about yourself</h2>
            <p className="mt-1 text-sm text-gray-500">A complete profile gets significantly more bookings.</p>
            <div className="mt-6 space-y-5">
              <FileField
                label="Profile photo"
                hint="Use a clear, friendly photo. Shown to clients when browsing cleaners."
                accept="image/*"
                file={profilePhoto}
                onChange={setProfilePhoto}
              />
              <div>
                <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Introduce yourself — your experience, what you specialise in, and why clients love working with you."
                  className={`${INPUT} resize-none`}
                />
                <p className={`mt-1 text-right text-xs ${bio.length >= 280 ? "text-amber-500" : "text-gray-400"}`}>
                  {bio.length} / 300
                </p>
              </div>
            </div>
          </>
        );

      // ── Step 5: Documents ─────────────────────────────────────────────
      case 5:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Verify your identity</h2>
            <p className="mt-1 text-sm text-gray-500">
              Reviewed manually by our team. Never shown publicly.
            </p>
            <div className="mt-6 space-y-4">
              <FileField
                label="Government-issued ID"
                hint="Passport, driver's licence, or national ID card."
                accept="image/*,.pdf"
                file={idDoc}
                onChange={setIdDoc}
              />
              <FileField
                label="Police check"
                hint="Must have been issued within the last 12 months."
                accept="image/*,.pdf"
                file={policeCheck}
                onChange={setPoliceCheck}
              />
              <FileField
                label="Public liability insurance certificate"
                accept="image/*,.pdf"
                file={insurance}
                onChange={setInsurance}
              />

              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-gray-900 accent-gray-900"
                />
                <span className="text-sm leading-snug text-gray-600">
                  I confirm all documents provided are genuine and up to date.
                </span>
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Wordmark */}
        <p className="mb-6 text-xl font-bold tracking-tight text-gray-900">Ameza</p>

        <div className="rounded-2xl bg-white px-6 py-8 shadow-[0_2px_24px_rgba(0,0,0,0.07)] sm:px-8 sm:py-10">
          <ProgressBar step={step} />

          {/* Step content */}
          <div>{renderStep()}</div>

          {/* Error banner */}
          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
            {step > 1 ? (
              <button type="button" onClick={back} className={BTN_GHOST}>
                <IconArrowLeft /> Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button type="button" onClick={next} className={BTN_PRIMARY}>
                Next <IconArrowRight />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className={BTN_PRIMARY}>
                {loading ? <><Spinner /> Submitting…</> : "Submit profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
