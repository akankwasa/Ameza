#!/usr/bin/env node
/**
 * Seed the `localities` table with all ~16,000 Australian suburbs and towns.
 *
 * Data source: matthewproctor/australianpostcodes (GitHub)
 *   https://github.com/matthewproctor/australianpostcodes
 *
 * Run:  npm run seed:localities
 *
 * Re-run quarterly to pick up new suburbs added by state governments.
 * The script truncates and re-inserts so it is safe to re-run.
 *
 * Prerequisites:
 *   - .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - The localities table must exist (run supabase-setup.sql first)
 */

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────

const envPath = join(__dir, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "✗  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

// ── CSV parser (handles quoted fields) ───────────────────────────────────

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────

const CSV_URL =
  "https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv";

async function main() {
  console.log("⬇  Fetching Australian postcode data...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching CSV`);
  const text = await res.text();

  const [headerLine, ...dataLines] = text.split("\n");
  const headers = parseCSVLine(headerLine.trim());
  const col = (name) => headers.indexOf(name);

  const COL = {
    postcode: col("postcode"),
    locality: col("locality"),
    state:    col("state"),
    type:     col("type"),
    sa4name:  col("sa4name"),
  };

  if (Object.values(COL).some((i) => i === -1)) {
    console.error("✗  Unexpected CSV headers:", headers.join(", "));
    process.exit(1);
  }

  console.log("⚙  Parsing CSV...");
  const localities = [];
  const seen = new Set();

  for (const rawLine of dataLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const row     = parseCSVLine(line);
    const type    = row[COL.type]?.trim();
    const suburb  = row[COL.locality]?.trim();
    const state   = row[COL.state]?.trim().toUpperCase();
    const post    = row[COL.postcode]?.trim();
    const sa4     = row[COL.sa4name]?.trim();

    // Delivery Area = real geographic suburb/town (excludes PO boxes, LVRs, etc.)
    if (type !== "Delivery Area") continue;
    if (!suburb || !state || !post) continue;

    // Skip territories outside the 8 main state/territory codes
    if (!["ACT","NSW","VIC","QLD","SA","WA","TAS","NT"].includes(state)) continue;

    const key = `${suburb.toLowerCase()}|${state}|${post}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Region = city/metro area from SA4 (e.g. "Melbourne - Inner" → "Melbourne")
    const region = sa4 ? sa4.split(" - ")[0].trim() : null;

    localities.push({ suburb, state, postcode: post, region });
  }

  console.log(`✓  Parsed ${localities.length.toLocaleString()} unique delivery areas.`);

  // ── Insert into Supabase ─────────────────────────────────────────────────

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("🗑  Clearing existing locality data...");
  const { error: delErr } = await supabase
    .from("localities")
    .delete()
    .gte("id", 0);
  if (delErr) console.warn("   (clear failed — table may be empty)", delErr.message);

  const BATCH = 500;
  let done = 0;
  process.stdout.write("⬆  Inserting: 0 / " + localities.length);

  for (let i = 0; i < localities.length; i += BATCH) {
    const batch = localities.slice(i, i + BATCH);
    const { error } = await supabase.from("localities").insert(batch);
    if (error) {
      console.error("\n✗  Insert error at batch", i, ":", error.message);
      process.exit(1);
    }
    done += batch.length;
    process.stdout.write(`\r⬆  Inserting: ${done.toLocaleString()} / ${localities.length.toLocaleString()}`);
  }

  console.log(`\n✅ Seeded ${done.toLocaleString()} localities into Supabase.`);
  console.log("   Re-run quarterly: npm run seed:localities");
}

main().catch((err) => {
  console.error("\n✗ Fatal:", err.message);
  process.exit(1);
});
