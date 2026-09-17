import { FixtureWorkspace } from "@/features/fixtures/fixture-workspace";
import { getTournamentById } from "@/services/tournament-service";
import { notFound } from "next/navigation";

interface TournamentMatchesPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentMatchesPage({ params }: TournamentMatchesPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);

  if (!tournament) {
    notFound();
  }

  return (
    <>
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="mb-6"><p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Tournament matches</p><h2 className="mt-2 text-2xl font-semibold text-zinc-900">Manage matches</h2><p className="mt-2 text-sm text-zinc-500">Schedule fixtures, start scoring, and manage match progress for this tournament.</p></div>
      <FixtureWorkspace tournamentId={tournamentId} />
      </div>
    </>
  );
}
