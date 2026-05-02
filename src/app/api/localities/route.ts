import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/localities?q=fitzroy&state=VIC&limit=10
// Returns matching suburbs ordered by name. Min 2 chars required.
export async function GET(request: NextRequest) {
  const params  = request.nextUrl.searchParams;
  const q       = params.get("q")?.trim() ?? "";
  const state   = params.get("state")?.trim().toUpperCase();
  const limit   = Math.min(Number(params.get("limit") ?? "10"), 20);

  if (q.length < 2) return Response.json([]);

  const supabase = await createClient();

  // Use ilike for prefix match; pg_trgm index on suburb makes this fast
  let query = supabase
    .from("localities")
    .select("id, suburb, state, postcode, region")
    .ilike("suburb", `${q}%`)
    .order("suburb")
    .limit(limit);

  if (state) query = query.eq("state", state);

  const { data, error } = await query;
  if (error) return Response.json([], { status: 500 });

  return Response.json(data ?? []);
}
