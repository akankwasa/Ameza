"use client";
// Subscribes to Supabase Realtime for a job's message thread.
// Returns messages array that updates live without polling.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";

export function useMessages(jobId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("messages").select("*").eq("job_id", jobId).order("created_at")
      .then(({ data }) => setMessages(data ?? []));

    const channel = supabase
      .channel(`messages:${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  return messages;
}
