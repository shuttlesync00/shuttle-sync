"use client";

import { normalizePhoneNumber } from "@/lib/phone";
import type { PlayerRecord } from "@/types/player";
import { useMemo, useState } from "react";

interface PlayerComboboxProps {
  label: string;
  players: PlayerRecord[];
  value: string;
  onChange: (playerId: string) => void;
}

export function PlayerCombobox({ label, players, value, onChange }: PlayerComboboxProps) {
  const selectedPlayer = players.find((player) => player.id === value);
  const [query, setQuery] = useState(selectedPlayer?.phoneNumber ?? "");
  const [open, setOpen] = useState(false);
  const normalizedQuery = normalizePhoneNumber(query);
  const suggestions = useMemo(() => {
    if (!normalizedQuery) return players.slice(0, 8);
    return players.filter((player) => normalizePhoneNumber(player.phoneNumber ?? "")?.includes(normalizedQuery)).slice(0, 8);
  }, [players, normalizedQuery]);

  function selectPlayer(player: PlayerRecord) {
    setQuery(player.phoneNumber ?? "");
    onChange(player.id);
    setOpen(false);
  }

  return (
    <label className="relative block text-sm">
      <span className="mb-2 block font-medium text-zinc-700">{label}</span>
      <input
        className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4"
        value={query}
        type="tel"
        placeholder="Enter mobile number"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextQuery = event.target.value;
          const normalizedPhone = normalizePhoneNumber(nextQuery);
          const exactMatch = normalizedPhone ? players.find((player) => normalizePhoneNumber(player.phoneNumber ?? "") === normalizedPhone) : undefined;
          setQuery(nextQuery);
          onChange(exactMatch?.id ?? "");
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 ? (
        <div className="absolute z-10 mt-2 max-h-52 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-1 shadow-lg">
          {suggestions.map((player) => (
            <button
              key={player.id}
              type="button"
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPlayer(player)}
            >
              <span className="block font-medium">{player.fullName}</span>
              <span className="block text-xs text-zinc-500">{player.phoneNumber}</span>
            </button>
          ))}
        </div>
      ) : null}
      {selectedPlayer ? <p className="mt-2 text-sm font-medium text-emerald-700">{selectedPlayer.fullName}</p> : null}
    </label>
  );
}