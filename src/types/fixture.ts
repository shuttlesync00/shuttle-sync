export type FixtureCategory = "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
export type FixtureStatus = "SCHEDULED" | "LIVE" | "COMPLETED";

export interface FixtureRecord {
  id: string;
  tournamentId: string;
  category: FixtureCategory;
  bestOf: number;
  teamAId: string | null;
  teamBId: string | null;
  playerAId?: string | null;
  playerBId?: string | null;
  court?: string | null;
  round?: number | null;
  matchNumber: number;
  date: string;
  time: string;
  status: FixtureStatus;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FixtureDraft {
  category: FixtureCategory;
  bestOf: number;
  teamAId?: string;
  teamBId?: string;
  playerAId?: string;
  playerBId?: string;
  court?: string;
  round?: number;
  date: string;
  time: string;
  notes?: string;
}
