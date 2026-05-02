import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-px">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className={`h-3.5 w-3.5 ${n <= rating ? "text-amber-400" : "text-gray-200"}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `id, rating, body, created_at,
       reviewer:profiles!reviewer_id ( full_name ),
       reviewee:profiles!reviewee_id ( full_name )`
    )
    .order("created_at", { ascending: false });

  const rows = (reviews ?? []) as {
    id: string;
    rating: number;
    body: string | null;
    created_at: string;
    reviewer: { full_name: string } | null;
    reviewee: { full_name: string } | null;
  }[];

  async function removeReview(reviewId: string) {
    "use server";
    const supa = await createClient();
    await supa.from("reviews").delete().eq("id", reviewId);
    revalidatePath("/admin/reviews");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500">{rows.length} total</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(review => (
            <div key={review.id} className="rounded-2xl bg-white px-5 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRow rating={review.rating} />
                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{review.reviewer?.full_name ?? "Anonymous"}</span>
                    {" → "}
                    <span className="font-medium text-gray-700">{review.reviewee?.full_name ?? "Unknown"}</span>
                  </p>
                  {review.body && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{review.body}</p>
                  )}
                </div>
                <form action={removeReview.bind(null, review.id)}>
                  <button
                    type="submit"
                    className="flex-shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
