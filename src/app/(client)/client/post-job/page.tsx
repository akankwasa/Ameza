"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/format";
import { LocationSelector } from "@/components/shared/LocationSelector";
import type { ServiceType } from "@/types/enums";

// ─── Constants ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Service", "Details", "Photos", "Review"] as const;

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

const SERVICE_LABEL: Record<ServiceType, string> = Object.fromEntries(
  SERVICES.map(({ value, label }) => [value, label])
) as Record<ServiceType, string>;

const PROPERTY_SIZES = [
  "Studio",
  "1 bedroom",
  "2 bedrooms",
  "3 bedrooms",
  "4+ bedrooms",
  "Commercial space",
];

const TIME_OPTIONS = [
  { value: "Morning 8am-12pm",   label: "Morning (8am – 12pm)"  },
  { value: "Afternoon 12pm-5pm", label: "Afternoon (12pm – 5pm)" },
  { value: "Evening 5pm-8pm",    label: "Evening (5pm – 8pm)"    },
  { value: "Flexible",           label: "Flexible"                },
];

// ─── Design tokens ────────────────────────────────────────────────────────

const BTN_PRIMARY =
  "flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_GHOST =
  "flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const INPUT =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

// ─── Icons ────────────────────────────────────────────────────────────────

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-gray-400">
      <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
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

// ─── Shared sub-components ────────────────────────────────────────────────

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  placeholder,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 ${
          value ? "text-gray-900" : "text-gray-400"
        }`}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-gray-400">
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEP_LABELS.map((_, idx) => {
          const n     = idx + 1;
          const done  = step > n;
          const active = step === n;
          return (
            <Fragment key={n}>
              {idx > 0 && (
                <div className={`h-px flex-1 transition-colors duration-300 ${step > idx ? "bg-gray-900" : "bg-gray-200"}`} />
              )}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                done || active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? <IconCheck /> : n}
              </div>
            </Fragment>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Step {step} of {STEP_LABELS.length} —{" "}
        <span className="font-semibold text-gray-900">{STEP_LABELS[step - 1]}</span>
      </p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-gray-100 py-2.5 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PostJobPage() {
  const router = useRouter();

  // Step 1
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  // Step 2
  const [suburb,        setSuburb]        = useState("");
  const [propertySize,  setPropertySize]  = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [budgetMin,     setBudgetMin]     = useState("");
  const [budgetMax,     setBudgetMax]     = useState("");
  const [notes,         setNotes]         = useState("");

  // Step 3
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  // UI
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Local YYYY-MM-DD for date input min
  const today = (() => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  })();

  // ── Handlers ──────────────────────────────────────────────────────────

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const incoming = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...incoming]);
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function validate(): string | null {
    if (step === 1 && !serviceType)
      return "Please select a service type to continue.";
    if (step === 2) {
      if (!suburb.trim()) return "Please enter a suburb.";
      if (!propertySize)  return "Please select a property size.";
      if (!preferredDate) return "Please select a preferred date.";
      if (!preferredTime) return "Please select a preferred time.";
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
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    // Upload photos sequentially to avoid rate limits
    const photoUrls: string[] = [];
    try {
      for (const { file } of photos) {
        const ext  = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("job-photos")
          .upload(path, file);
        if (upErr) throw upErr;
        photoUrls.push(
          supabase.storage.from("job-photos").getPublicUrl(path).data.publicUrl
        );
      }
    } catch {
      setError("Photo upload failed. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from("jobs").insert({
      client_id:      user.id,
      cleaner_id:     null,
      service_type:   serviceType,
      suburb:         suburb.trim(),
      property_size:  propertySize,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      budget_min:     budgetMin ? parseFloat(budgetMin) : null,
      budget_max:     budgetMax ? parseFloat(budgetMax) : null,
      notes:          notes.trim() || null,
      photo_urls:     photoUrls,
      status:         "pending",
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    router.push("/client/dashboard");
  }

  // ── Step renderers ────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      case 1:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">What do you need cleaned?</h2>
            <p className="mt-1 text-sm text-gray-500">Select one service type.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {SERVICES.map(({ value, label }) => {
                const selected = serviceType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setServiceType(value)}
                    className={`relative rounded-xl border-2 px-3 py-3.5 text-left text-sm font-medium transition-all duration-150 ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 opacity-80">
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

      case 2:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Tell us about the job</h2>
            <p className="mt-1 text-sm text-gray-500">
              These details help cleaners understand what&apos;s needed.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Suburb</label>
                <LocationSelector id="suburb" value={suburb} onChange={setSuburb} />
              </div>

              <Field id="propertySize" label="Property size">
                <SelectField
                  id="propertySize"
                  value={propertySize}
                  onChange={setPropertySize}
                  placeholder="Select size"
                >
                  {PROPERTY_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </SelectField>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="preferredDate" label="Preferred date">
                  <input
                    id="preferredDate"
                    type="date"
                    min={today}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className={INPUT}
                  />
                </Field>

                <Field id="preferredTime" label="Preferred time">
                  <SelectField
                    id="preferredTime"
                    value={preferredTime}
                    onChange={setPreferredTime}
                    placeholder="Select time"
                  >
                    {TIME_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </SelectField>
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">
                  Budget range{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      min={0}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="Min"
                      className={`${INPUT} pl-7`}
                    />
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      min={0}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="Max"
                      className={`${INPUT} pl-7`}
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-400">AUD. Leave blank if you&apos;re open to quotes.</p>
              </div>

              <Field id="notes" label="Notes" hint="Optional">
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or access details…"
                  className={`${INPUT} resize-none`}
                />
              </Field>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Add photos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Help cleaners understand the scope of the job.
            </p>
            <div className="mt-6">
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-gray-400 hover:bg-gray-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoSelect}
                />
                <IconUpload />
                <div>
                  <p className="text-sm font-medium text-gray-700">Click to add photos</p>
                  <p className="mt-0.5 text-xs text-gray-400">PNG, JPG or HEIC — up to 10 MB each</p>
                </div>
              </label>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map(({ preview }, idx) => (
                    <div key={idx} className="group relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="h-full w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/75 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove photo"
                      >
                        <IconX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case 4: {
        const timeLabel = TIME_OPTIONS.find((t) => t.value === preferredTime)?.label ?? preferredTime;
        const budgetDisplay = budgetMin && budgetMax
          ? `$${budgetMin} – $${budgetMax} AUD`
          : budgetMin  ? `From $${budgetMin} AUD`
          : budgetMax  ? `Up to $${budgetMax} AUD`
          : "Not specified";

        return (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Review your job</h2>
            <p className="mt-1 text-sm text-gray-500">
              Double-check everything before posting.
            </p>
            <dl className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-5 py-1">
              <ReviewRow label="Service type"   value={SERVICE_LABEL[serviceType!]} />
              <ReviewRow label="Suburb"         value={suburb} />
              <ReviewRow label="Property size"  value={propertySize} />
              <ReviewRow label="Preferred date" value={formatDate(preferredDate)} />
              <ReviewRow label="Preferred time" value={timeLabel} />
              <ReviewRow label="Budget"         value={budgetDisplay} />
              <ReviewRow label="Notes"          value={notes.trim() || "None"} />
              <ReviewRow
                label="Photos"
                value={photos.length > 0
                  ? `${photos.length} photo${photos.length !== 1 ? "s" : ""} attached`
                  : "None"}
              />
            </dl>
          </>
        );
      }

      default:
        return null;
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────

  const isLast   = step === STEP_LABELS.length;
  const isPhotos = step === 3;

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-xl font-bold tracking-tight text-gray-900">Ameza</p>

        <div className="rounded-2xl bg-white px-6 py-8 shadow-[0_2px_24px_rgba(0,0,0,0.07)] sm:px-8 sm:py-10">
          <ProgressBar step={step} />

          <div>{renderStep()}</div>

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

            <div className="flex items-center gap-3">
              {isPhotos && (
                <button
                  type="button"
                  onClick={next}
                  className="text-sm text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Skip
                </button>
              )}

              {isLast ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={BTN_PRIMARY}
                >
                  {loading ? <><Spinner /> Posting…</> : "Post job"}
                </button>
              ) : (
                <button type="button" onClick={next} className={BTN_PRIMARY}>
                  Next <IconArrowRight />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
