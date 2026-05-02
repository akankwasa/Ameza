import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("profiles")
    .select(`id, full_name, suburb, created_at, jobs:jobs!jobs_client_id_fkey ( id )`)
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const rows = (clients ?? []) as unknown as {
    id: string;
    full_name: string;
    suburb: string | null;
    created_at: string;
    jobs: { id: string }[];
  }[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clients</h1>
        <p className="text-sm text-gray-500">{rows.length} registered</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">No clients registered yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          {rows.map((client, i) => (
            <div
              key={client.id}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{client.full_name}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {client.suburb ?? "No suburb"} &middot; Joined {formatDate(client.created_at)}
                </p>
              </div>
              <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {client.jobs.length} job{client.jobs.length !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
