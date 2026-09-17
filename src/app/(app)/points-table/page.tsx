import { getUser } from "@/lib/supabase/server";
import { getTournamentStandings } from "@/services/analytics-service";
import { listTournamentsForUser } from "@/services/tournament-service";
import Link from "next/link";

interface PointsTablePageProps {
  searchParams: Promise<{ tournamentId?: string }>;
}

export default async function PointsTablePage({ searchParams }: PointsTablePageProps) {
  const { tournamentId } = await searchParams;
  const user = await getUser();
  const tournaments = user ? await listTournamentsForUser(user.id) : [];
  const selectedTournament = tournamentId ? tournaments.find((t) => t.id === tournamentId) : null;

  const standings = tournamentId ? await getTournamentStandings(tournamentId) : {};
  const hasStandings = Object.keys(standings).length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Points Tables</h1>
            <p className="mt-3 text-sm text-zinc-500">Select a tournament to view its standings and point difference summary.</p>
          </div>
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-[260px] flex-col gap-2 text-sm text-zinc-600">
              Tournament
              <select name="tournamentId" defaultValue={tournamentId ?? ""} className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="">Choose tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
              View standings
            </button>
          </form>
        </div>

        {selectedTournament ? (
          <p className="mt-4 text-sm text-zinc-500">Showing standings for <span className="font-semibold text-zinc-900">{selectedTournament.name}</span>.</p>
        ) : tournamentId ? (
          <p className="mt-4 text-sm text-zinc-500">Tournament not found in your account. Try selecting another tournament.</p>
        ) : null}
      </div>

      {!tournamentId ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          {tournaments.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">You do not have any tournaments yet.</p>
              <Link href="/tournaments/new" className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Create a tournament</Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Select one of your tournaments above to load its points table.</p>
          )}
        </div>
      ) : hasStandings ? (
        Object.entries(standings).map(([category, rows]) => (
          <div key={category} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold text-zinc-900">{category}</h2>
            <div className="mt-4 overflow-x-auto no-scrollbar">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[38%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[31%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-sm text-zinc-600">
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Points</th>
                    <th>Point Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-zinc-100">
                      <td className="py-3 text-sm font-medium text-zinc-900">{r.teamName}</td>
                      <td className="py-3 text-sm text-zinc-700">{r.played}</td>
                      <td className="py-3 text-sm text-zinc-700">{r.won}</td>
                      <td className="py-3 text-sm text-zinc-700">{r.lost}</td>
                      <td className="py-3 text-sm font-semibold text-zinc-700">{r.leaguePoints}</td>
                      <td className="py-3 text-sm text-zinc-700">{r.pointsDifference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-zinc-500">No standings are available yet for this tournament.</p>
        </div>
      )}
    </div>
  );
}
