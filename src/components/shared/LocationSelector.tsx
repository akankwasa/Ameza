"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

type Locality = {
  id: number;
  suburb: string;
  state: string;
  postcode: string;
  region: string | null;
};

// ─── Shared primitives ────────────────────────────────────────────────────

const INPUT =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
    </svg>
  );
}

// ─── Core autocomplete hook ───────────────────────────────────────────────

function useAutocomplete(onSelect: (loc: Locality) => void) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Locality[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [cursor,   setCursor]   = useState(-1);
  const debounce   = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/localities?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json() as Locality[];
      setResults(data);
      setOpen(data.length > 0);
      setCursor(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 250);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); select(results[cursor]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  function select(loc: Locality) {
    setQuery(loc.suburb);
    setResults([]);
    setOpen(false);
    onSelect(loc);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return { query, results, open, loading, cursor, containerRef, handleChange, handleKeyDown, select, clear, setQuery };
}

// ─── Dropdown list ────────────────────────────────────────────────────────

function DropdownList({
  results,
  cursor,
  onSelect,
}: {
  results: Locality[];
  cursor: number;
  onSelect: (loc: Locality) => void;
}) {
  return (
    <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
      {results.map((loc, i) => (
        <li key={loc.id}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
            onClick={() => onSelect(loc)}
            className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
              i === cursor ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <span className="font-medium text-gray-900">{loc.suburb}</span>
            <span className="flex-shrink-0 text-xs text-gray-400">
              {loc.state} {loc.postcode}
              {loc.region ? ` · ${loc.region}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── LocationSelector — single suburb ────────────────────────────────────
// Props unchanged from previous version — consuming pages need no edits.

export function LocationSelector({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (suburb: string) => void;
  id?: string;
}) {
  const ac = useAutocomplete((loc) => onChange(loc.suburb));

  // Sync display when value is cleared externally
  useEffect(() => {
    if (!value) ac.clear();
    else if (value !== ac.query) ac.setQuery(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div ref={ac.containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={ac.query}
        onChange={ac.handleChange}
        onKeyDown={ac.handleKeyDown}
        onFocus={() => ac.results.length > 0 && ac.open}
        placeholder="Search suburb or town…"
        autoComplete="off"
        className={INPUT}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {ac.loading ? (
          <SpinnerIcon />
        ) : ac.query ? (
          <button type="button" onClick={() => { ac.clear(); onChange(""); }} className="text-gray-300 hover:text-gray-500">
            <XIcon />
          </button>
        ) : null}
      </div>
      {ac.open && (
        <DropdownList results={ac.results} cursor={ac.cursor} onSelect={ac.select} />
      )}
    </div>
  );
}

// ─── CoverageSelector — multi-suburb for cleaners ─────────────────────────
// Props unchanged from previous version — consuming pages need no edits.

export function CoverageSelector({
  suburbs,
  onChange,
}: {
  suburbs: string[];
  onChange: (suburbs: string[]) => void;
}) {
  const ac = useAutocomplete((loc) => {
    if (!suburbs.includes(loc.suburb)) {
      onChange([...suburbs, loc.suburb]);
    }
    ac.clear();
  });

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

      {/* Search input */}
      <div ref={ac.containerRef} className="relative">
        <input
          type="text"
          value={ac.query}
          onChange={ac.handleChange}
          onKeyDown={ac.handleKeyDown}
          placeholder="Search and add suburbs or towns…"
          autoComplete="off"
          className={INPUT}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {ac.loading ? <SpinnerIcon /> : ac.query ? (
            <button type="button" onClick={ac.clear} className="text-gray-300 hover:text-gray-500"><XIcon /></button>
          ) : null}
        </div>
        {ac.open && (
          <DropdownList results={ac.results} cursor={ac.cursor} onSelect={ac.select} />
        )}
      </div>
      <p className="text-xs text-gray-400">
        Type a suburb or town name and select from the list. Add as many as you cover.
      </p>
    </div>
  );
}
