export interface TeamRecord {
  id: string;
  name: string;
  logoUrl?: string | null;
  category: "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
  playerIds: string[];
  tournamentId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDraft {
  name: string;
  logoUrl?: string;
  category: "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
  playerIds: string[];
  tournamentId?: string;
}
