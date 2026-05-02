import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { ServiceType } from "@/types/enums";

// ─── Constants ────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceType, string> = {
  regular_domestic: "Regular domestic",
  once_off:         "Once-off clean",
  end_of_lease:     "End of lease",
  carpet:           "Carpet cleaning",
  commercial:       "Commercial",
  move_in:          "Move-in clean",
  window:           "Window cleaning",
  pressure_wash:    "Pressure wash",
};

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIMES = ["Morning", "Afternoon", "Evening"] as const;

// ─── Shared helpers ───────────────────────────────────────────────────────

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function StarIcon({ filled, cls = "h-4 w-4" }: { filled: boolean; cls?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`${cls} ${filled ? "text-amber-400" : "text-gray-200"}`}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
    </svg>
  );
}

function FilledStars({ avg, count }: { avg: number; count: number }) {
  if (count === 0) {
    return <span className="text-sm text-gray-400">No reviews yet</span>;
  }
  const filled = Math.round(avg);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= filled} />
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {avg.toFixed(1)} &middot; {count} review{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)] sm:p-7">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
      {label}
    </span>
  );
}

// Tell Next.js not to attempt static pre-rendering for this dynamic route.
// All cleaner profiles are fetched at request time.
export async function generateStaticParams() {
  return [];
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function CleanerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Guard against an empty/undefined slug before hitting the DB
  if (!slug) notFound();

  const supabase = await createClient();

  // Fetch cleaner profile + current user in parallel.
  // maybeSingle() returns { data: null, error: null } for 0 rows — no thrown error.
  const [cleanerResult, { data: { user } }] = await Promise.all([
    supabase
      .from("cleaner_profiles")
      .select(
        `id, bio, services, hourly_rate, coverage_suburbs,
         availability, is_verified, rating_avg, rating_count, slug,
         profiles ( full_name, avatar_url )`
      )
      .eq("slug", slug)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!cleanerResult.data) notFound();

  const cleaner = cleanerResult.data;
  const profile = cleaner.profiles as { full_name: string; avatar_url: string | null } | null;
  const name    = profile?.full_name ?? "Unknown";
  const avail   = (cleaner.availability ?? {}) as Record<string, string[]>;

  // Fetch reviews + user's role in parallel
  const [{ data: reviews }, { data: userProfile }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, rating, body, created_at, reviewer:profiles!reviewer_id ( full_name )")
      .eq("reviewee_id", cleaner.id)
      .order("created_at", { ascending: false }),

    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  // CTA
  const isClient = userProfile?.role === "client";
  const ctaHref  = user ? (isClient ? "/client/post-job" : null) : "/register";
  const ctaLabel = user ? "Post a job" : "Sign up to book";

  // Derived
  const hasAvailability = DAYS.some((d) => (avail[d] ?? []).length > 0);

  return (
    <div className="min-h-screen bg-neutral-50 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-5">

          {/* ── Profile header ─────────────────────────────────── */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

              {/* Avatar */}
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={name}
                  className="h-24 w-24 flex-shrink-0 rounded-full object-cover ring-4 ring-gray-100 sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-2xl font-bold text-white ring-4 ring-gray-100 sm:h-28 sm:w-28">
                  {getInitials(name)}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">{name}</h1>
                  {cleaner.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <FilledStars avg={cleaner.rating_avg} count={cleaner.rating_count} />
                </div>

                <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                  from ${cleaner.hourly_rate}
                  <span className="text-base font-normal text-gray-400">/hr</span>
                </p>

                {ctaHref && (
                  <Link
                    href={ctaHref}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                  >
                    {ctaLabel}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── About ──────────────────────────────────────────── */}
          {cleaner.bio && (
            <Section title="About">
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {cleaner.bio}
              </p>
            </Section>
          )}

          {/* ── Services ───────────────────────────────────────── */}
          {cleaner.services.length > 0 && (
            <Section title="Services offered">
              <div className="flex flex-wrap gap-2">
                {cleaner.services.map((svc) => (
                  <Tag key={svc} label={SERVICE_LABELS[svc as ServiceType] ?? svc} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Coverage ───────────────────────────────────────── */}
          {cleaner.coverage_suburbs.length > 0 && (
            <Section title="Coverage area">
              <div className="flex flex-wrap gap-2">
                {cleaner.coverage_suburbs.map((suburb) => (
                  <Tag key={suburb} label={suburb} />
                ))}
              </div>
            </Section>
          )}

          {/* ── Availability ───────────────────────────────────── */}
          <Section title="Availability">
            {hasAvailability ? (
              <>
                <div className="overflow-x-auto">
                  <div className="grid min-w-[280px] grid-cols-[3.5rem_1fr_1fr_1fr] gap-1.5">
                    {/* Header row */}
                    <div />
                    {TIMES.map((t) => (
                      <div key={t} className="pb-1 text-center text-xs font-medium text-gray-500">
                        {t}
                      </div>
                    ))}
                    {/* Day rows */}
                    {DAYS.map((day) => (
                      <Fragment key={day}>
                        <div className="flex items-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                        {TIMES.map((time) => {
                          const on = (avail[day] ?? []).includes(time);
                          return (
                            <div
                              key={time}
                              className={`h-8 rounded-lg transition-colors ${
                                on ? "bg-gray-900" : "bg-gray-100"
                              }`}
                            />
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded bg-gray-900" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded bg-gray-100 ring-1 ring-gray-200" />
                    Unavailable
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">No availability set yet.</p>
            )}
          </Section>

          {/* ── Reviews ────────────────────────────────────────── */}
          <Section
            title={`Reviews${cleaner.rating_count > 0 ? ` (${cleaner.rating_count})` : ""}`}
          >
            {reviews && reviews.length > 0 ? (
              <div className="space-y-5">
                {reviews.map((review) => {
                  const reviewer = review.reviewer as { full_name: string } | null;
                  const reviewerName = reviewer?.full_name ?? "Anonymous";
                  const filled = Math.round(review.rating);
                  return (
                    <div key={review.id} className="flex gap-4">
                      {/* Initials avatar */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {getInitials(reviewerName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex gap-px">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <StarIcon key={n} filled={n <= filled} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.body && (
                          <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                            {review.body}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No reviews yet — be the first to book and leave one.
              </p>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}
