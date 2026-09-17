import { getPlayerById } from "@/services/player-service";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PlayerProfilePageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);

  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Player Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{player.fullName}</h1>
            <p className="mt-2 text-sm text-zinc-500">{player.city}, {player.state}, {player.country}</p>
          </div>
          <Link href="/players" className="inline-flex items-center rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">Back to players</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-zinc-500">Playing Level</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{player.playingLevel}</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-zinc-500">Preferred Hand</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{player.preferredHand}</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <p className="text-sm text-zinc-500">Age</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{player.age}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:col-span-2">
          <h2 className="text-xl font-semibold text-zinc-900">Match History</h2>
          <p className="mt-3 text-sm text-zinc-500">This section will be connected as soon as match data is available.</p>
        </div>
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-zinc-900">Achievements</h2>
          <p className="mt-3 text-sm text-zinc-500">Placeholder for future achievements.</p>
        </div>
      </div>
    </div>
  );
}
