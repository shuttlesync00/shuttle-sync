export type PlayerGender = "MALE" | "FEMALE" | "OTHER";
export type PlayerPreferredHand = "RIGHT" | "LEFT";
export type PlayerPlayingLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";

export interface PlayerRecord {
  id: string;
  photoUrl?: string | null;
  fullName: string;
  gender: PlayerGender;
  dateOfBirth: string;
  age: number;
  phoneNumber?: string | null;
  email?: string | null;
  preferredHand: PlayerPreferredHand;
  playingLevel: PlayerPlayingLevel;
  city: string;
  state: string;
  country: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerDraft {
  photoUrl?: string;
  fullName: string;
  gender: PlayerGender;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  preferredHand: PlayerPreferredHand;
  playingLevel: PlayerPlayingLevel;
  city: string;
  state: string;
  country: string;
}
