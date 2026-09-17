export type TournamentType = "OPEN" | "CORPORATE" | "COMMUNITY" | "COLLEGE" | "UNIVERSITY" | "SCHOOL" | "SERIES" | "OTHER";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED";
export type MatchCategory = "SINGLES" | "DOUBLES" | "MIXED_DOUBLES";
export type ShuttleType = "PLASTIC" | "FEATHER";

export interface TournamentRecord {
  id: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  name: string;
  city: string;
  ground: string;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  startDate: string;
  endDate: string;
  type: TournamentType;
  matchCategories: MatchCategory[];
  shuttleType: ShuttleType;
  description?: string | null;
  bestOf: number;
  status: TournamentStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDraft {
  name: string;
  city: string;
  ground: string;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  startDate: string;
  endDate: string;
  type: TournamentType;
  matchCategories: MatchCategory[];
  shuttleType: ShuttleType;
  description?: string;
  bestOf: number;
}
