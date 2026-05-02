import Image from "next/image";
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
    <div className="min-h-screen bg-neutral-50">

      {/* Hero banner */}
      <div className="relative h-56 overflow-hidden sm:h-72">
        <Image
          src="https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=1400&q=80"
          alt="Professional cleaning equipment and supplies"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Find a cleaner near you
          </h1>
          <p className="mt-2 text-base text-white/70">
            {cleaners?.length ?? 0} verified cleaner{cleaners?.length !== 1 ? "s" : ""} ready to help.
          </p>
        </div>
      </div>

      {/* Browser */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <CleanerBrowser cleaners={(cleaners ?? []) as unknown as CleanerCard[]} />
      </div>
    </div>
  );
}
