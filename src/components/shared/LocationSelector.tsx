"use client";

import { useEffect, useState } from "react";
import { LOCATIONS, STATES, STATE_NAMES } from "@/lib/locations";

// ─── Shared select style ──────────────────────────────────────────────────

const SELECT =
  "block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-8 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
    >
      <path
        fillRule="evenodd"
        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SelectBox({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${SELECT} ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {children}
      </select>
      <ChevronDown />
    </div>
  );
}

// ─── Find state+city for a stored suburb name ─────────────────────────────

function findLocation(suburb: string): { state: string; city: string } {
  for (const [state, cities] of Object.entries(LOCATIONS)) {
    for (const [city, suburbs] of Object.entries(cities)) {
      if (suburbs.includes(suburb)) return { state, city };
    }
  }
  return { state: "", city: "" };
}

// ─── Single-suburb selector ───────────────────────────────────────────────
// Use for: post-job suburb, client profile suburb

export function LocationSelector({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (suburb: string) => void;
  id?: string;
}) {
  const initial = value ? findLocation(value) : { state: "", city: "" };
  const [state, setState] = useState(initial.state);
  const [city,  setCity]  = useState(initial.city);

  // Sync if value is cleared externally
  useEffect(() => {
    if (!value) { setState(""); setCity(""); }
  }, [value]);

  const cities  = state ? Object.keys(LOCATIONS[state] ?? {}) : [];
  const suburbs = state && city ? (LOCATIONS[state]?.[city] ?? []) : [];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <SelectBox
        value={state}
        onChange={(s) => { setState(s); setCity(""); onChange(""); }}
        placeholder="State"
      >
        {STATES.map((s) => (
          <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>
        ))}
      </SelectBox>

      <SelectBox
        value={city}
        onChange={(c) => { setCity(c); onChange(""); }}
        disabled={!state}
        placeholder="City / region"
      >
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </SelectBox>

      <SelectBox
        id={id}
        value={value}
        onChange={onChange}
        disabled={!city}
        placeholder="Suburb"
      >
        {suburbs.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </SelectBox>
    </div>
  );
}

// ─── Multi-suburb selector (for cleaner coverage) ─────────────────────────
// Use for: cleaner onboarding + profile edit coverage_suburbs

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
    </svg>
  );
}

export function CoverageSelector({
  suburbs,
  onChange,
}: {
  suburbs: string[];
  onChange: (suburbs: string[]) => void;
}) {
  const [state,  setState]  = useState("");
  const [city,   setCity]   = useState("");
  const [suburb, setSuburb] = useState("");

  const cities       = state ? Object.keys(LOCATIONS[state] ?? {}) : [];
  const suburbOptions = state && city ? (LOCATIONS[state]?.[city] ?? []) : [];

  function add() {
    if (suburb && !suburbs.includes(suburb)) {
      onChange([...suburbs, suburb]);
    }
    setSuburb("");
  }

  return (
    <div className="space-y-3">
      {/* Existing suburb tags */}
      {suburbs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suburbs.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(suburbs.filter((x) => x !== s))}
                className="text-gray-400 hover:text-gray-700"
                aria-label={`Remove ${s}`}
              >
                <XIcon />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cascading dropdowns */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SelectBox
          value={state}
          onChange={(s) => { setState(s); setCity(""); setSuburb(""); }}
          placeholder="State"
        >
          {STATES.map((s) => (
            <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>
          ))}
        </SelectBox>

        <SelectBox
          value={city}
          onChange={(c) => { setCity(c); setSuburb(""); }}
          disabled={!state}
          placeholder="City / region"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </SelectBox>

        <SelectBox
          value={suburb}
          onChange={setSuburb}
          disabled={!city}
          placeholder="Suburb"
        >
          {suburbOptions
            .filter((s) => !suburbs.includes(s))
            .map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
        </SelectBox>
      </div>

      <button
        type="button"
        onClick={add}
        disabled={!suburb}
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Add suburb
      </button>
    </div>
  );
}
