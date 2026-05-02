"use client";
// Subscribes to Supabase Realtime for live job status updates.
// Client and cleaner pages use this to react to status changes without refreshing.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JobStatus } from "@/types";

export function useJobStatus(jobId: string, initialStatus: JobStatus) {
  const [status, setStatus] = useState<JobStatus>(initialStatus);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`job-status:${jobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => setStatus((payload.new as { status: JobStatus }).status)
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  return status;
}
