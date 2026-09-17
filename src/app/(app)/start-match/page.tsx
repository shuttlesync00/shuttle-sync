import { StartMatchClient } from "@/components/start-match/start-match-client";
import { getUser } from "@/lib/supabase/server";
import { listTournamentsForUser } from "@/services/tournament-service";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function StartMatchPage() {
  const user = await getUser();
  if (!user) {
    return notFound();
  }

  const tournaments = await listTournamentsForUser(user.id);

  return (
    <Suspense fallback={<div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><p className="text-sm text-zinc-500">Loading match details…</p></div>}>
      <StartMatchClient tournaments={tournaments} />
    </Suspense>
  );
}
