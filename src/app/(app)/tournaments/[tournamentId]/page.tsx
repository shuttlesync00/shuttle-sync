import { TournamentEndDateForm } from "@/features/tournaments/tournament-end-date-form";
import { listFixturesForTournament } from "@/services/fixture-service";
import { listTeams } from "@/services/team-service";
import { getTournamentById } from "@/services/tournament-service";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TournamentWorkspacePageProps { params: Promise<{ tournamentId: string }> }

export default async function TournamentWorkspacePage({ params }: TournamentWorkspacePageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();
  const [teams, fixtures] = await Promise.all([listTeams(undefined, tournamentId), listFixturesForTournament(tournamentId)]);
  const completedFixtures = fixtures.filter((fixture) => fixture.status === "COMPLETED").length;
  const liveFixtures = fixtures.filter((fixture) => fixture.status === "LIVE").length;
  const matchCategories = Array.isArray(tournament.matchCategories) ? tournament.matchCategories : [];
  const categoryList = matchCategories.length > 0 ? matchCategories.join(", ") : "Any";

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_0.95fr]">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between"><div><p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Tournament summary</p><h2 className="mt-2 text-2xl font-semibold text-zinc-900">Event overview</h2><p className="mt-3 text-sm text-zinc-500">Review tournament details, view standings, and manage fixtures from the tournament workspace.</p></div><div className="grid gap-3 sm:grid-cols-4">{[["Teams", teams.length], ["Fixtures", fixtures.length], ["Live", liveFixtures], ["Completed", completedFixtures]].map(([label, value]) => <div key={String(label)} className="rounded-3xl bg-zinc-50 p-4 text-sm text-zinc-500"><p className="font-medium text-zinc-900">{label}</p><p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p></div>)}</div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-3xl bg-zinc-50 p-5"><p className="text-sm font-medium text-zinc-900">Organizer</p><p className="mt-2 text-sm text-zinc-500">{tournament.organizerName || "Not set"}</p><p className="mt-3 text-sm font-medium text-zinc-900">Contact</p><p className="mt-2 text-sm text-zinc-500">{tournament.organizerPhone || "Not set"} / {tournament.organizerEmail || "Not set"}</p></div><div className="rounded-3xl bg-zinc-50 p-5"><p className="text-sm font-medium text-zinc-900">Schedule</p><p className="mt-2 text-sm text-zinc-500">{tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD"} — {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : "TBD"}</p>{tournament.status !== "COMPLETED" ? <TournamentEndDateForm tournamentId={tournamentId} endDate={tournament.endDate} /> : null}<p className="mt-3 text-sm font-medium text-zinc-900">Venue</p><p className="mt-2 text-sm text-zinc-500">{tournament.ground || "Not set"}, {tournament.city || "Not set"}</p><p className="mt-3 text-sm font-medium text-zinc-900">Format</p><p className="mt-2 text-sm text-zinc-500">{categoryList}</p><p className="mt-3 text-sm font-medium text-zinc-900">Shuttle type</p><p className="mt-2 text-sm text-zinc-500">{tournament.shuttleType}</p></div></div>
      </div>
      <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8"><p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Quick actions</p><h2 className="mt-3 text-2xl font-semibold text-zinc-900">Manage this tournament</h2><p className="mt-2 text-sm text-zinc-700">Use the workspace actions below to complete setup, update matches, and review standings.</p><div className="mt-6 grid gap-3"><Link href={`/tournaments/${tournamentId}/setup`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100">Open setup guide</Link><Link href={`/tournaments/${tournamentId}/teams`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100">View teams</Link><Link href={`/tournaments/${tournamentId}/matches`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100">Manage matches</Link><Link href={`/tournaments/${tournamentId}/standings`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100">View standings</Link></div></div>
    </div>
  );
}
