export interface StandingRecord {
  id: string;
  category: "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  leaguePoints: number;
  gamesWon: number;
  gamesLost: number;
  pointsDifference: number;
  winPercentage: number;
}

export interface StandingsResponse {
  category: "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
  standings: StandingRecord[];
}

export interface TournamentResultRecord {
  id: string;
  matchNumber?: number | null;
  round?: number | null;
  category?: string | null;
  winnerName: string;
  scoreHome: number;
  scoreAway: number;
  gameScores?: Array<{ home: number; away: number; completed: boolean }>;
  duration: string;
  date: string;
  winnerTeamId?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  completedAt?: string | null;
}

export interface TournamentStatistics {
  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;
  totalPlayers: number;
  totalTeams: number;
  averageMatchDuration: string;
  longestMatchDuration: string;
  highestScore: number;
}
