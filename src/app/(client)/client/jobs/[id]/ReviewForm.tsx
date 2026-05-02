"use client";

import { useState } from "react";
import { submitReview } from "@/app/actions/reviews";

// ─── Types ────────────────────────────────────────────────────────────────

export type ExistingReview = {
  rating: number;
  body: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"] as const;

function StarIcon({ filled, large = false }: { filled: boolean; large?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`${large ? "h-8 w-8" : "h-4 w-4"} ${filled ? "text-amber-400" : "text-gray-200"}`}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
    </svg>
  );
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= rating} />
      ))}
    </div>
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

export function ReviewForm({
  jobId,
  cleanerId,
  cleanerName,
  existingReview,
}: {
  jobId: string;
  cleanerId: string;
  cleanerName: string;
  existingReview: ExistingReview | null;
}) {
  // Initialise from server-side review if it exists
  const [rating,        setRating]        = useState(existingReview?.rating ?? 0);
  const [hovered,       setHovered]       = useState(0);
  const [body,          setBody]          = useState(existingReview?.body ?? "");
  const [done,          setDone]          = useState(existingReview !== null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please choose a star rating before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(jobId, cleanerId, rating, body.trim());
      setDone(true);
      setJustSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Read-only view (server-loaded or just submitted) ───────────────────

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        {justSubmitted && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 flex-shrink-0"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            Thanks for reviewing {cleanerName}! It helps the Ameza community.
          </div>
        )}

        <h3 className="mb-4 text-base font-semibold text-gray-900">Your review</h3>

        <ReadOnlyStars rating={rating} />
        <p className="mt-1 text-xs text-gray-400">{RATING_LABELS[rating]}</p>

        {body.trim() && (
          <p className="mt-3 text-sm leading-relaxed text-gray-700">{body.trim()}</p>
        )}

        <p className="mt-3 text-xs text-gray-400">Review for {cleanerName}</p>
      </div>
    );
  }

  // ── Interactive form ───────────────────────────────────────────────────

  const activeRating = hovered || rating;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <h3 className="text-base font-semibold text-gray-900">How did it go?</h3>
      <p className="mt-1 text-sm text-gray-500">
        Leave a review for {cleanerName}. It helps other clients choose with confidence.
      </p>

      {/* Star selector */}
      <div className="mt-5">
        <p className="mb-2.5 text-xs font-medium text-gray-500">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
              className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:rounded"
            >
              <StarIcon filled={n <= activeRating} large />
            </button>
          ))}
        </div>
        <p className={`mt-1.5 h-4 text-xs font-medium ${activeRating > 0 ? "text-amber-500" : "text-transparent"}`}>
          {RATING_LABELS[activeRating] ?? ""}
        </p>
      </div>

      {/* Body */}
      <div className="mt-5">
        <label
          htmlFor="review-body"
          className="mb-1.5 block text-xs font-medium text-gray-500"
        >
          Written review{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="review-body"
          rows={4}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`What did you think of ${cleanerName}'s work? Would you recommend them?`}
          className="block w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
        />
        <p
          className={`mt-1 text-right text-xs ${
            body.length >= 480 ? "text-amber-500" : "text-gray-400"
          }`}
        >
          {body.length} / 500
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="mt-5 flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Spinner />
            Submitting…
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </div>
  );
}
