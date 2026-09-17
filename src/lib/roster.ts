import type { PlayerRecord } from "@/types/player";
import type { TeamRecord } from "@/types/team";

export type TeamRosterStatus = "READY" | "INCOMPLETE" | "INVALID";

export interface TeamRosterValidationResult {
  status: TeamRosterStatus;
  requiredPlayers: number;
  currentPlayers: number;
  message: string;
  issues: string[];
}

const rosterRules = {
  SINGLES: { players: 1 },
  DOUBLES: { players: 2 },
  MIXED_DOUBLES: { players: 2, male: 1, female: 1 },
} as const;

export function validateTeamRoster(team: Pick<TeamRecord, "category">, players: PlayerRecord[]): TeamRosterValidationResult {
  const rule = rosterRules[team.category];
  const currentPlayers = players.length;
  const requiredPlayers = rule.players;
  const genders = players.map((player) => player.gender);
  const maleCount = genders.filter((value) => value === "MALE").length;
  const femaleCount = genders.filter((value) => value === "FEMALE").length;

  if (currentPlayers < requiredPlayers) {
    return {
      status: "INCOMPLETE",
      requiredPlayers,
      currentPlayers,
      message: currentPlayers === 0 ? "Roster incomplete" : `Needs ${requiredPlayers - currentPlayers} more player${requiredPlayers - currentPlayers === 1 ? "" : "s"}`,
      issues: [currentPlayers === 0 ? `Needs ${requiredPlayers} player${requiredPlayers === 1 ? "" : "s"} before fixtures can be generated.` : `Needs ${requiredPlayers - currentPlayers} more player${requiredPlayers - currentPlayers === 1 ? "" : "s"}.`],
    };
  }

  if (currentPlayers > requiredPlayers) {
    return {
      status: "INVALID",
      requiredPlayers,
      currentPlayers,
      message: "Roster has too many players",
      issues: [`${team.category.replace("_", " ")} teams need exactly ${requiredPlayers} player${requiredPlayers === 1 ? "" : "s"}.`],
    };
  }

  if (team.category === "MIXED_DOUBLES") {
    if (maleCount < 1 || femaleCount < 1) {
      return {
        status: "INVALID",
        requiredPlayers,
        currentPlayers,
        message: "Mixed doubles needs one male and one female",
        issues: ["Mixed doubles requires one male and one female player."],
      };
    }
  }

  return {
    status: "READY",
    requiredPlayers,
    currentPlayers,
    message: "Roster complete",
    issues: [],
  };
}
