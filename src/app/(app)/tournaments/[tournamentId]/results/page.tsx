import { getTournamentResults } from '@/services/analytics-service';
import { getTournamentById } from '@/services/tournament-service';
import { notFound } from 'next/navigation';

interface TournamentWorkspacePageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentResultsPage({ params }: TournamentWorkspacePageProps) {
  const p = await params;
  const tournamentId = p.tournamentId;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();
  const results = await getTournamentResults(tournamentId);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <h1 className="text-2xl font-semibold text-zinc-900">Results</h1>
        <p className="mt-3 text-sm text-zinc-500">Completed matches are listed here with score, duration, and date.</p>
      </div>
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        {results.length === 0 ? (
          <p className="text-sm text-zinc-500">No completed matches yet.</p>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.id} className="rounded-md border border-zinc-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500">{r.round ? `Round ${r.round}` : "Round"} · Match {r.matchNumber ?? '-'}</div>
                  <div className="text-sm text-zinc-500">{r.completedAt ? new Date(r.completedAt).toLocaleString() : ''}</div>
                </div>

                <div className="mt-2 flex items-center gap-4">
                  <div className="text-lg font-semibold">{r.homeTeamName}</div>
                  <div className="text-lg">{r.scoreHome}–{r.scoreAway}</div>
                  <div className="text-lg font-semibold">{r.awayTeamName}</div>
                </div>

                <div className="mt-2 text-sm text-zinc-600">Winner: {r.winnerName}</div>
                <div className="mt-2 text-sm text-zinc-600">Won by {Math.abs(r.scoreHome - r.scoreAway)} point{Math.abs(r.scoreHome - r.scoreAway) === 1 ? "" : "s"}</div>

                <div className="mt-2 text-sm">
                  <div className="font-medium">Game breakdown</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    {r.gameScores?.map((g, idx) => (
                      <div key={idx} className="rounded-md border border-zinc-100 bg-zinc-50 p-2">
                        <div className="font-medium">Game {idx + 1}</div>
                        <div className="mt-1">{g.home}–{g.away} {g.completed ? '(completed)' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
