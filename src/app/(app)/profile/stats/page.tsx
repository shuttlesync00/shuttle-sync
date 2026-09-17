import { BadmintonStatsClient } from "@/features/profile/badminton-stats-client";
import { getUser } from "@/lib/supabase/server";
import { getAuthenticatedProfile, getAuthenticatedUserMatches } from "@/services/profile-service";
import { notFound } from "next/navigation";

export default async function ProfileStatsPage() {
  const user = await getUser();
  if (!user) return notFound();

  const profile = await getAuthenticatedProfile(user);
  const matches = await getAuthenticatedUserMatches(profile);

  return <BadmintonStatsClient profile={profile} matches={matches} />;
}
