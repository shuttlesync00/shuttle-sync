import { ProfilePageClient } from "@/features/profile/profile-page-client";
import { getUser } from "@/lib/supabase/server";
import { getAuthenticatedProfile, getAuthenticatedUserMatches, getPlayerTitles, summarizeUserMatches } from "@/services/profile-service";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) return notFound();

  const profile = await getAuthenticatedProfile(user);
  const matches = await getAuthenticatedUserMatches(profile);
  const titles = await getPlayerTitles(profile.playerId);

  return (
    <ProfilePageClient profile={profile} stats={{ ...summarizeUserMatches(matches), titles }} recentMatches={matches.slice(0, 5)} />
  );
}
