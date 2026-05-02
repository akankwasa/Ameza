import { createClient } from "@/lib/supabase/server";
import { CleanerBrowser, type CleanerCard } from "./CleanerBrowser";

export default async function CleanersPage() {
  const supabase = await createClient();

  const { data: cleaners } = await supabase
    .from("cleaner_profiles")
    .select(
      `id, slug, hourly_rate, rating_avg, rating_count,
       services, coverage_suburbs,
       profiles ( full_name, avatar_url )`
    )
    .eq("is_verified", true)
    .order("rating_avg", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Find a cleaner near you
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {cleaners?.length ?? 0} verified cleaner{cleaners?.length !== 1 ? "s" : ""} available.
          </p>
        </div>

        <CleanerBrowser cleaners={(cleaners ?? []) as CleanerCard[]} />
      </div>
    </div>
  );
}
