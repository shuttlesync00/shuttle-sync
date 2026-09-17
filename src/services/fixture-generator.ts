export type FixtureGenerationFormat = "ROUND_ROBIN" | "KNOCKOUT" | "MANUAL";

interface FixtureTeamLike {
  id: string;
  name: string;
  category: "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
}

interface FixtureGenerationInput {
  tournament: { id: string; name: string };
  teams: FixtureTeamLike[];
  format: FixtureGenerationFormat;
}

export interface GeneratedFixture {
  tournamentId: string;
  round: number;
  teamAId: string;
  teamBId: string;
  status: "SCHEDULED";
  court: string | null;
  date: string | null;
  time: string | null;
}

export function generateFixtures({ tournament, teams, format }: FixtureGenerationInput): GeneratedFixture[] {
  if (format !== "ROUND_ROBIN") {
    throw new Error("Round robin only is supported in this version.");
  }

  if (teams.length < 2) {
    return [];
  }

  const orderedTeams = [...teams];
  const fixtures: GeneratedFixture[] = [];
  const totalRounds = orderedTeams.length - 1;

  for (let round = 1; round <= totalRounds; round += 1) {
    const roundFixtures: Array<{ teamAId: string; teamBId: string }> = [];
    roundFixtures.push({ teamAId: orderedTeams[0].id, teamBId: orderedTeams[1].id });

    for (let index = 2; index < orderedTeams.length; index += 2) {
      const teamA = orderedTeams[index];
      const teamB = orderedTeams[index + 1];
      if (!teamA || !teamB) continue;
      roundFixtures.push({ teamAId: teamA.id, teamBId: teamB.id });
    }

    for (const roundFixture of roundFixtures) {
      fixtures.push({
        tournamentId: tournament.id,
        round,
        teamAId: roundFixture.teamAId,
        teamBId: roundFixture.teamBId,
        status: "SCHEDULED",
        court: null,
        date: null,
        time: null,
      });
    }

    const [firstTeam, ...restTeams] = orderedTeams;
    if (!firstTeam) break;
    const [secondTeam, ...additionalTeams] = restTeams;
    if (!secondTeam) break;
    orderedTeams.splice(0, orderedTeams.length, firstTeam, ...additionalTeams, secondTeam);
  }

  return fixtures;
}
