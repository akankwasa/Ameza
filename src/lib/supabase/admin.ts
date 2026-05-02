// Service-role client. USE ONLY in server-side admin actions.
// Never import this in any file that could be bundled for the client.
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
