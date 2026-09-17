"use client";

import type { PlayerRecord } from "@/types/player";

interface SelectedPlayersListProps {
  players: PlayerRecord[];
  onRemove: (playerId: string) => void;
}

export function SelectedPlayersList({ players, onRemove }: SelectedPlayersListProps) {
  if (!players.length) {
    return <p className="text-sm text-zinc-500">No players selected yet.</p>;
  }

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="font-medium text-zinc-700">{player.fullName}</span>
          <button type="button" onClick={() => onRemove(player.id)} className="text-sm text-red-500">Remove</button>
        </div>
      ))}
    </div>
  );
}
