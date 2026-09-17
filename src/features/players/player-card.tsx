"use client";

import { PlayerAvatar } from "@/features/players/player-avatar";
import type { PlayerRecord } from "@/types/player";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface PlayerCardProps {
  player: PlayerRecord;
  onDelete?: (playerId: string) => void;
}

export function PlayerCard({ player, onDelete }: PlayerCardProps) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.fullName} photoUrl={player.photoUrl} size="md" />
          <div>
            <h3 className="font-semibold text-zinc-900">{player.fullName}</h3>
            <p className="text-sm text-zinc-500">{player.playingLevel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/players/${player.id}`} className="rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-50">
            <Pencil size={16} />
          </Link>
          <button type="button" onClick={() => onDelete?.(player.id)} className="rounded-full border border-red-200 p-2 text-red-500 transition hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
        <MapPin size={16} />
        <span>{player.city}, {player.state}, {player.country}</span>
      </div>
    </div>
  );
}
