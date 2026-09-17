import { PlayersList } from "@/features/players/players-list";
import { getUser } from "@/lib/supabase/server";
import { getAllPlayersForUser } from "@/services/player-service";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function PlayersPage() {
  const user = await getUser();
  const players = user ? await getAllPlayersForUser(user.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Player Database</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Players</h1>
          <p className="mt-2 text-sm text-zinc-500">Create and reuse a permanent player database for every tournament and friendly match.</p>
        </div>
        <Link href="/players/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
          <Plus size={18} />
          Add Player
        </Link>
      </div>

      <div className="rounded-[32px] border border-zinc-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
        <PlayersList initialPlayers={players} />
      </div>
    </div>
  );
}
