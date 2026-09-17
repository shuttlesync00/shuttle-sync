import { MatchesPlayedClient } from "@/features/matches/matches-played-client";
import { getUser } from "@/lib/supabase/server";
import { listOneOffMatches } from "@/services/match-service";
import { getAuthenticatedProfile } from "@/services/profile-service";
import { notFound } from "next/navigation";

export default async function MatchesPlayedPage() {
  const user = await getUser();
  if (!user) return notFound();

  const profile = await getAuthenticatedProfile(user);
  const matches = await listOneOffMatches(profile.id, profile.playerId);
  return <MatchesPlayedClient initialMatches={matches} />;
}