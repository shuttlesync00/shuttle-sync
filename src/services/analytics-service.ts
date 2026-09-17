import { prisma } from "@/lib/prisma";
import type { TournamentResultRecord, TournamentStatistics } from "@/types/analytics";
import type { TournamentStanding } from "@prisma/client";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}



export async function getTournamentStandings(tournamentId: string) {
  if (!prisma) return {};

  const rows = await prisma.tournamentStanding.findMany({
    where: { tournamentId },
    include: { team: true },
    orderBy: [
      { won: "desc" },
      { pointsDifference: "desc" },
      { team: { name: "asc" } },
    ],
  });

  return rows.reduce<Record<string, ReturnType<typeof mapStanding>[]>>((acc, row) => {
    const category = row.category as "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
    if (!acc[category]) acc[category] = [];
    acc[category].push(mapStanding(row));
    return acc;
  }, {} as Record<string, ReturnType<typeof mapStanding>[]>);
}

function mapStanding(row: TournamentStanding & { team: { name: string } }) {
  return {
    id: row.id,
    category: row.category,
    teamId: row.teamId,
    teamName: row.team.name,
    played: row.played,
    won: row.won,
    lost: row.lost,
    leaguePoints: row.won * 2,
    gamesWon: row.gamesWon,
    gamesLost: row.gamesLost,
    pointsDifference: row.pointsDifference,
    winPercentage: row.winPercentage,
  };
}

export async function getTournamentResults(tournamentId: string): Promise<TournamentResultRecord[]> {
  if (!prisma) return [];
  const rows = await prisma.match.findMany({
    where: { tournamentId, status: "COMPLETED" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: "asc" },
  });

  const results: TournamentResultRecord[] = [];
  for (const row of rows) {
    const durationSeconds = row.startedAt && row.endedAt ? Math.max(0, Math.round((row.endedAt.getTime() - row.startedAt.getTime()) / 1000)) : 0;
    const winnerName = row.winnerTeamId === row.homeTeamId ? row.homeTeam?.name ?? "Unknown team" : row.awayTeam?.name ?? "Unknown team";

    // try to find fixture round for this match when available
    let round: number | null = null;
    if (prisma) {
      const fixture = await prisma.fixture.findFirst({
        where: {
          tournamentId: row.tournamentId ?? undefined,
          matchNumber: row.matchNumber ?? undefined,
          teamAId: row.homeTeamId,
          teamBId: row.awayTeamId,
        },
      });
      if (fixture) round = fixture.round ?? null;
    }

    results.push({
      id: row.id,
      matchNumber: row.matchNumber,
      round,
      category: row.category,
      winnerName,
      scoreHome: row.scoreHome,
      scoreAway: row.scoreAway,
      gameScores: row.gameScores as unknown as Array<{ home: number; away: number; completed: boolean }>,
      duration: formatDuration(durationSeconds),
      date: row.endedAt?.toISOString() ?? "",
      winnerTeamId: row.winnerTeamId ?? null,
      homeTeamName: row.homeTeam?.name ?? null,
      awayTeamName: row.awayTeam?.name ?? null,
      completedAt: row.endedAt?.toISOString() ?? null,
    });
  }

  return results;
}

export async function getTournamentStatistics(tournamentId: string): Promise<TournamentStatistics | null> {
  if (!prisma) return null;

  const analytics = await prisma.tournamentAnalytics.findUnique({ where: { tournamentId } });
  if (!analytics) return null;

  return {
    totalMatches: analytics.totalMatches,
    completedMatches: analytics.completedMatches,
    remainingMatches: analytics.remainingMatches,
    totalPlayers: analytics.totalPlayers,
    totalTeams: analytics.totalTeams,
    averageMatchDuration: formatDuration(analytics.averageMatchDurationSeconds),
    longestMatchDuration: formatDuration(analytics.longestMatchDurationSeconds),
    highestScore: analytics.highestScore,
  };
}
