export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "LIVE" | "COMPLETED";
export type MatchSide = "home" | "away";

export interface MatchGameScore {
  home: number;
  away: number;
  completed: boolean;
}

export interface MatchRecord {
  id: string;
  status: MatchStatus;
  tournamentId?: string | null;
  tournamentName?: string | null;
  category?: string | null;
  court?: string | null;
  matchNumber?: number | null;
  bestOf: number;
  gamePointTarget: number;
  currentGame: number;
  scoreHome: number;
  scoreAway: number;
  gameScores: MatchGameScore[];
  homeTeamId: string | null;
  awayTeamId: string | null;
  playerAId?: string | null;
  playerBId?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  winnerTeamId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchUpdateDraft {
  status?: MatchStatus;
  category?: string | null;
  court?: string | null;
  matchNumber?: number | null;
  bestOf?: number;
  gamePointTarget?: number;
  currentGame?: number;
  scoreHome?: number;
  scoreAway?: number;
  gameScores?: MatchGameScore[];
  winnerTeamId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

export type MatchPointPayload = {
  side: MatchSide;
};

export type MatchUndoPayload = {
  side: MatchSide;
};
