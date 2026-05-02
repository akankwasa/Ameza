// PHASE 2 AUTOMATION: replaces the manual assignCleaner() server action.
// Triggered by a Supabase DB webhook on jobs INSERT (status=pending).
//
// Logic:
//   1. Receive job payload (suburb, service_type)
//   2. Query cleaner_profiles WHERE is_verified=true
//      AND coverage_suburbs @> ARRAY[job.suburb]
//      AND services @> ARRAY[job.service_type]
//      ORDER BY rating_avg DESC
//      LIMIT 1
//   3. Update jobs SET cleaner_id=match.id, status='matched'
//   4. Send notification emails to client and cleaner
//
// To activate in Phase 2:
//   - Deploy this function via supabase functions deploy assign-cleaner
//   - Set a DB webhook in Supabase Dashboard: trigger on jobs INSERT, invoke this function
//   - Remove or disable the admin manual assign UI (or keep it as a fallback)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => {
  const payload = await req.json();
  // TODO: implement matching logic
  return new Response(JSON.stringify({ assigned: false, reason: "not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
});
