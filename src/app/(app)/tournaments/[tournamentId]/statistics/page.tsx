interface TournamentWorkspacePageProps {
  params: Promise<{ tournamentId: string }>;
}
import { getTournamentById } from "@/services/tournament-service";
import { notFound } from "next/navigation";

export default async function TournamentStatisticsPage({ params }: TournamentWorkspacePageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <h1 className="text-2xl font-semibold text-zinc-900">Statistics</h1>
        <p className="mt-3 text-sm text-zinc-500">Tournament-level analytics summary updated automatically.</p>
      </div>
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm text-zinc-500">Statistics will appear here once analytics are enabled.</p>
      </div>
    </div>
  );
}
