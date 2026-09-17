import { TeamBuilder } from "@/features/teams/team-builder";
import { getAllPlayersForUser } from "@/services/player-service";
import Link from "next/link";

type NewTeamPageProps = {
  searchParams?: { tournamentId?: string } | Promise<{ tournamentId?: string } | undefined>;
};

export const dynamic = "force-dynamic";

export default async function NewTeamPage({ searchParams }: NewTeamPageProps) {
  const players = await getAllPlayersForUser();
  // `searchParams` can be a Promise in some Next.js runtimes — await it to
  // ensure we read the actual values without relying on `any`.
  const resolvedSearchParams = (await searchParams) as { tournamentId?: string } | undefined;
  const tournamentId = resolvedSearchParams?.tournamentId;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Create Team</h1>
            <p className="mt-2 text-sm text-zinc-500">Build temporary teams from your permanent player database for a tournament or friendly match.</p>
          </div>
          {tournamentId ? (
            <Link href={`/tournaments/${encodeURIComponent(tournamentId)}/teams`} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Back to tournament teams
            </Link>
          ) : null}
        </div>
      </div>
      <TeamBuilder players={players} tournamentId={tournamentId} />
    </div>
  );
}
