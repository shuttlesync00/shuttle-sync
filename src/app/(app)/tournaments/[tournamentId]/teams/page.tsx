import { validateTeamRoster } from "@/lib/roster";
import { listTeamPlayersForTeams, listTeams } from "@/services/team-service";
import { getTournamentById } from "@/services/tournament-service";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TournamentTeamsPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentTeamsPage({ params }: TournamentTeamsPageProps) {
  const { tournamentId } = await params;
  const [tournament, teams] = await Promise.all([getTournamentById(tournamentId), listTeams(undefined, tournamentId)]);

  if (!tournament) {
    notFound();
  }

  const playersByTeam = await listTeamPlayersForTeams(teams.map((team) => team.id));
  const rosterEntries = teams.map((team) => ({
    team,
    validation: validateTeamRoster(team, playersByTeam.get(team.id) ?? []),
  }));

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament Teams</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{tournament.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">Manage teams that are competing in this tournament.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/teams/new?tournamentId=${encodeURIComponent(tournamentId)}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
            Add Team
          </Link>
        </div>
      </div>

      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        {teams.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-600">
            <p className="text-lg font-semibold text-zinc-900">No teams created yet</p>
            <p className="mt-2">Create teams to begin scheduling fixtures for your tournament.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rosterEntries.map(({ team, validation }) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="rounded-[28px] border border-zinc-200 p-5 transition hover:border-emerald-400 hover:bg-zinc-50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">{team.name}</p>
                    <p className="text-sm text-zinc-500">Category: {team.category}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${validation.status === "READY" ? "bg-emerald-100 text-emerald-700" : validation.status === "INVALID" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {validation.status}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-700">
                      {validation.currentPlayers}/{validation.requiredPlayers}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-500">{validation.status === "READY" ? "Roster complete" : validation.message}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
