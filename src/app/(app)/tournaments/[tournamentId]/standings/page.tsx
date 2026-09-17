import { getTournamentStandings } from "@/services/analytics-service";
import { getTournamentById } from "@/services/tournament-service";
import { notFound } from "next/navigation";

interface TournamentWorkspacePageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentStandingsPage({ params }: TournamentWorkspacePageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();
  const standings = await getTournamentStandings(tournamentId);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <h1 className="text-2xl font-semibold text-zinc-900">Standings</h1>
        <p className="mt-3 text-sm text-zinc-500">Automatically updated after every completed match.</p>
      </div>

      {Object.keys(standings).length === 0 ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-zinc-500">No standings available yet. Complete matches to populate standings.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
