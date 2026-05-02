"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/messages";

// ─── Types ────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.25a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .811 1.022l11-4.25a.75.75 0 0 0 0-1.394l-11-4.761Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function MessageThread({
  jobId,
  currentUserId,
}: {
  jobId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Initial fetch + realtime subscription ──────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel(`messages_job_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            // Deduplicate by real ID
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // Replace matching optimistic placeholder
            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith("temp_") &&
                m.sender_id === incoming.sender_id &&
                m.body === incoming.body
            );
            if (tempIdx !== -1) {
              return prev.map((m, i) => (i === tempIdx ? incoming : m));
            }
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ───────────────────────────────────────────────────────────────

  async function handleSend() {
    const body = input.trim();
    if (!body || sending) return;

    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id:         tempId,
        job_id:     jobId,
        sender_id:  currentUserId,
        body,
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");
    setError(null);
    setSending(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "42px";

    try {
      await sendMessage(jobId, body);
    } catch {
      setError("Failed to send. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-grow up to 128 px
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Messages</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* Message list */}
      <div className="h-80 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn  = msg.sender_id === currentUserId;
              const isTemp = msg.id.startsWith("temp_");
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-xs break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-sm ${
                      isOwn
                        ? `rounded-br-sm bg-gray-900 text-white ${isTemp ? "opacity-60" : ""}`
                        : "rounded-bl-sm bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.body}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {isTemp ? "Sending…" : formatTime(msg.created_at)}
                  </p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
        {error && (
          <p className="mb-2 text-xs text-red-500">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            style={{ minHeight: "42px" }}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Spinner /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
