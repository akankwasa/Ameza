// Returns a ranked list of cleaner suggestions for a given job without auto-assigning.
// Used by the admin jobs page to pre-populate the assign dropdown with best matches.
// Call: POST /functions/v1/match-suggestions with { jobId: string }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => {
  const { jobId } = await req.json();
  // TODO: query cleaner_profiles filtered by suburb + service, ordered by rating_avg
  return new Response(JSON.stringify({ suggestions: [] }), {
    headers: { "Content-Type": "application/json" },
  });
});
