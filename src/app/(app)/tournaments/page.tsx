import { getUser } from "@/lib/supabase/server";
import { listTournamentsForUser } from "@/services/tournament-service";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function TournamentsPage() {
  const user = await getUser();
  const tournaments = user ? await listTournamentsForUser(user.id) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament Hub</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Tournaments</h1>
            <p className="mt-2 text-sm text-zinc-500">Browse and open your tournament workspaces from one place.</p>
          </div>
          <Link href="/tournaments/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
            <Plus size={18} />
            Create Tournament
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {tournaments.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-600">
            No tournaments yet. Start by creating your first event.
          </div>
        ) : (
          tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Tournament</p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-900">{tournament.name}</h2>
                  <p className="mt-3 text-sm text-zinc-500">{tournament.organizerName || "Organizer details not available"}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-700">
                  Open <span aria-hidden>→</span>
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4 text-sm text-zinc-500">
                <div>
                  <p className="font-medium text-zinc-900">Venue</p>
                  <p>{tournament.ground || "TBD"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">City</p>
                  <p>{tournament.city || "TBD"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Dates</p>
                  <p>{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD"} — {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : "TBD"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Status</p>
                  <p className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-zinc-700 inline-block">{tournament.status}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
