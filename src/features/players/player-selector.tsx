"use client";

import { SearchBar } from "@/features/players/search-bar";
import type { PlayerRecord } from "@/types/player";

interface PlayerSelectorProps {
  players: PlayerRecord[];
  selectedIds: string[];
  onToggle: (playerId: string) => void;
}

export function PlayerSelector({ players, selectedIds, onToggle }: PlayerSelectorProps) {
  return (
    <div className="space-y-3">
      <SearchBar value="" onChange={() => undefined} placeholder="Search existing players" />
      <div className="space-y-2">
        {players.map((player) => {
          const checked = selectedIds.includes(player.id);
          return (
            <label key={player.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="font-medium text-zinc-700">{player.fullName}</span>
              <input type="checkbox" checked={checked} onChange={() => onToggle(player.id)} className="h-4 w-4 rounded border-zinc-300 text-emerald-500" />
            </label>
          );
        })}
      </div>
    </div>
  );
}
