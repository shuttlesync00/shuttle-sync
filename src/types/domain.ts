export interface TournamentSummary {
  id: string;
  name: string;
  status: string;
  ownerId: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  ownerId: string;
}

export interface MatchSummary {
  id: string;
  status: string;
  scoreHome: number;
  scoreAway: number;
  ownerId: string;
}

export interface PlayerHistoryEntry {
  id: string;
  title: string;
  description?: string | null;
}

export interface PlayerStatsSummary {
  id: string;
  category: string;
  value: number;
}
