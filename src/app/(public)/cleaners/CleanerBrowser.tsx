"use client";

import { useState } from "react";
import Link from "next/link";
import type { ServiceType } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────

export type CleanerCard = {
  id: string;
  slug: string;
  hourly_rate: number;
  rating_avg: number;
  rating_count: number;
  services: ServiceType[];
  coverage_suburbs: string[];
  profiles: { full_name: string; avatar_url: string | null } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
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
  SERVICE_OPTIONS.map(({ value, label }) => [value, label])
) as Record<ServiceType, string>;

const MIN_RATING_OPTIONS = [
  { value: "",    label: "Any rating" },
  { value: "4",   label: "4+ stars"   },
  { value: "4.5", label: "4.5+ stars" },
];

const INPUT =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

// ─── Small helpers ────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
      {getInitials(name)}
    </div>
  );
}

function RatingDisplay({ avg, count }: { avg: number; count: number }) {
  if (count === 0) {
    return (
      <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        New
      </span>
    );
  }
  const filled = Math.round(avg);
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <div className="flex gap-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-3.5 w-3.5 ${n <= filled ? "text-amber-400" : "text-gray-200"}`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-400">
        {avg.toFixed(1)} ({count} review{count !== 1 ? "s" : ""})
      </span>
    </div>
  );
}

function SelectFilter({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} appearance-none pr-9 ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

function CleanerCardUI({ cleaner }: { cleaner: CleanerCard }) {
  const name       = cleaner.profiles?.full_name ?? "Unknown";
  const avatarUrl  = cleaner.profiles?.avatar_url ?? null;

  const shownServices = cleaner.services.slice(0, 3);
  const extraServices = cleaner.services.length - 3;

  const shownSuburbs  = cleaner.coverage_suburbs.slice(0, 2);
  const extraSuburbs  = cleaner.coverage_suburbs.length - 2;

  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      {/* Avatar + name + rating */}
      <div className="flex items-start gap-3.5">
        <Avatar name={name} url={avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <RatingDisplay avg={cleaner.rating_avg} count={cleaner.rating_count} />
        </div>
      </div>

      {/* Rate */}
      <p className="mt-4 text-xl font-bold tracking-tight text-gray-900">
        from ${cleaner.hourly_rate}
        <span className="text-sm font-normal text-gray-400">/hr</span>
      </p>

      {/* Services */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {shownServices.map((svc) => (
          <span
            key={svc}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
          >
            {SERVICE_LABEL[svc] ?? svc}
          </span>
        ))}
        {extraServices > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-400">
            +{extraServices} more
          </span>
        )}
      </div>

      {/* Suburbs */}
      {cleaner.coverage_suburbs.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Covers: </span>
          {shownSuburbs.join(", ")}
          {extraSuburbs > 0 && ` +${extraSuburbs} more`}
        </p>
      )}

      {/* CTA */}
      <div className="mt-auto pt-5">
        <Link
          href={`/cleaners/${cleaner.slug || cleaner.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white"
        >
          View profile
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────

export function CleanerBrowser({ cleaners }: { cleaners: CleanerCard[] }) {
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [suburb,      setSuburb]      = useState("");
  const [minRating,   setMinRating]   = useState("");

  const filtered = cleaners.filter((c) => {
    if (serviceType && !c.services.includes(serviceType as ServiceType)) return false;
    if (suburb.trim()) {
      const q = suburb.trim().toLowerCase();
      if (!c.coverage_suburbs.some((s) => s.toLowerCase().includes(q))) return false;
    }
    if (minRating && c.rating_avg < parseFloat(minRating)) return false;
    return true;
  });

  const hasActiveFilter = serviceType !== "" || suburb.trim() !== "" || minRating !== "";

  return (
    <>
      {/* ── Filter bar ────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="serviceType"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Service type
            </label>
            <SelectFilter
              id="serviceType"
              value={serviceType}
              onChange={(v) => setServiceType(v as ServiceType | "")}
            >
              <option value="">All services</option>
              {SERVICE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectFilter>
          </div>

          <div className="flex-1">
            <label
              htmlFor="suburb"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Suburb
            </label>
            <input
              id="suburb"
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. Fitzroy"
              className={INPUT}
            />
          </div>

          <div className="sm:w-40">
            <label
              htmlFor="minRating"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Min rating
            </label>
            <SelectFilter
              id="minRating"
              value={minRating}
              onChange={setMinRating}
            >
              {MIN_RATING_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectFilter>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setServiceType(""); setSuburb(""); setMinRating(""); }}
              className="flex-shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 sm:self-end"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────────── */}
      <p className="mb-5 text-sm text-gray-500">
        {filtered.length} cleaner{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* ── Grid ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <p className="text-sm font-semibold text-gray-900">
            {hasActiveFilter ? "No cleaners match your filters." : "No verified cleaners found."}
          </p>
          <p className="mt-1.5 text-sm text-gray-400">
            {hasActiveFilter
              ? "Try broadening your search."
              : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cleaner) => (
            <CleanerCardUI key={cleaner.id} cleaner={cleaner} />
          ))}
        </div>
      )}
    </>
  );
}
