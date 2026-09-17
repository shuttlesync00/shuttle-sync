import { TournamentSetupWorkflow } from "@/features/tournaments/tournament-setup-workflow";
import { validateTeamRoster } from "@/lib/roster";
import { listFixturesForTournament } from "@/services/fixture-service";
import { listTeamPlayersForTeams, listTeams } from "@/services/team-service";
import { getTournamentById } from "@/services/tournament-service";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TournamentSetupPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentSetupPage({ params }: TournamentSetupPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    notFound();
  }

  const [teams, fixtures] = await Promise.all([listTeams(undefined, tournamentId), listFixturesForTournament(tournamentId)]);
  const playersByTeam = await listTeamPlayersForTeams(teams.map((team) => team.id));
  const rosterStatuses = teams.map((team) => validateTeamRoster(team, playersByTeam.get(team.id) ?? []));
  const readyTeams = rosterStatuses.filter((status) => status.status === "READY").length;
  const allRostersReady = teams.length > 0 && readyTeams === teams.length;
  const tournamentStarted = fixtures.some((fixture) => fixture.status === "LIVE" || fixture.status === "COMPLETED");
  const nextStep = teams.length === 0
    ? { label: "Add Teams", href: `/tournaments/${tournamentId}/teams` }
    : !allRostersReady
    ? { label: "Complete Rosters", href: `/tournaments/${tournamentId}/teams` }
    : fixtures.length === 0
    ? { label: "Generate Fixtures", href: `/tournaments/${tournamentId}/matches` }
    : { label: "Open Matches", href: `/tournaments/${tournamentId}/matches` };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament Setup</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{tournament.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">Follow the guided workflow to add teams, schedule matches, and start scoring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tournaments/${tournamentId}`} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Back to workspace
            </Link>
            <Link href={`/tournaments/${tournamentId}/teams`} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
              View tournament teams
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <TournamentSetupWorkflow
            teamCount={teams.length}
            rosterReadyCount={readyTeams}
            fixtureCount={fixtures.length}
            tournamentStarted={tournamentStarted}
            nextStepLabel={nextStep.label}
            nextStepHref={nextStep.href}
          />
        </div>

        <div className="space-y-4 rounded-[32px] border border-zinc-200 bg-zinc-50 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Current progress</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Quick summary</h2>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-zinc-500">Teams added</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{teams.length}</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-zinc-500">Ready rosters</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{readyTeams}/{teams.length}</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-zinc-500">Scheduled fixtures</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{fixtures.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
