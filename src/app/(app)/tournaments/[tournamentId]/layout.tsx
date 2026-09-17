import { TournamentWorkspaceShell } from "@/features/tournaments/tournament-workspace-shell";
import { getTournamentById } from "@/services/tournament-service";
import { notFound } from "next/navigation";

export default async function TournamentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tournamentId: string }> }) {
  const { tournamentId } = await params;
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) notFound();

  return <TournamentWorkspaceShell tournament={tournament}>{children}</TournamentWorkspaceShell>;
}