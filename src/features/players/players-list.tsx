"use client";

import { PlayerCard } from "@/features/players/player-card";
import { SearchBar } from "@/features/players/search-bar";
import { useToast } from "@/hooks/use-toast";
import type { PlayerRecord } from "@/types/player";
import { useMemo, useState } from "react";

interface PlayersListProps {
  initialPlayers: PlayerRecord[];
}

export function PlayersList({ initialPlayers }: PlayersListProps) {
  const [players, setPlayers] = useState<PlayerRecord[]>(initialPlayers);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filteredPlayers = useMemo(() => {
    const filterValue = search.trim().toLowerCase();
    if (!filterValue) return players;

    return players.filter((player) => {
      return [
        player.fullName,
        player.playingLevel,
        player.city,
        player.state,
        player.country,
        player.email ?? "",
      ].some((value) => value.toLowerCase().includes(filterValue));
    });
  }, [players, search]);

  async function handleDelete(playerId: string) {
    if (!window.confirm("Delete this player?")) {
      return;
    }

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete player.");
      }

      setPlayers((current) => current.filter((player) => player.id !== playerId));
      toast({ title: "Player deleted.", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete player.";
      toast({ title: message, type: "error" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search players" />
        <div className="rounded-full bg-zinc-100 px-3 py-2 text-sm text-zinc-600">{players.length} players</div>
      </div>
      {filteredPlayers.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          No players match your search.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
