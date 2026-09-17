"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TournamentEndButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  async function endTournament() {
    if (!window.confirm("End this tournament now?")) return;
    setEnding(true);
    await fetch("/api/tournaments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "END", id: tournamentId }) });
    router.refresh();
    setEnding(false);
  }

  return <button type="button" onClick={() => void endTournament()} disabled={ending} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{ending ? "Ending…" : "End Tournament"}</button>;
}