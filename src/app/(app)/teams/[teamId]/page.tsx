import { TeamDetails } from "@/features/teams/team-details";
import { getTeamById, listTeamPlayers } from "@/services/team-service";
import { notFound } from "next/navigation";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;
  const team = await getTeamById(teamId);

  if (!team) {
    notFound();
  }

  const players = await listTeamPlayers(teamId);

  return <TeamDetails team={team} initialPlayers={players} />;
}
