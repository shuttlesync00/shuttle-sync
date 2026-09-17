"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MatchSummary {
  id: string;
  category: string | null;
  status: string;
  tournamentName: string | null;
  matchNumber: number | null;
  bestOf: number;
  scoreHome: number;
  scoreAway: number;
  homeName: string;
  awayName: string;
  court: string | null;
  startedAt: string | null;
  createdAt: string;
}

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function MatchesPlayedClient({ initialMatches }: { initialMatches: MatchSummary[] }) {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);

  async function handleDelete(matchId: string) {
    if (!window.confirm("Delete match?\n\nAre you sure you want to permanently delete this match?\nThis action cannot be undone.")) return;

    setDeletingId(matchId);
    try {
      const response = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to delete match.");
      setMatches((current) => current.filter((match) => match.id !== matchId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete match.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleFinish(matchId: string) {
    if (!window.confirm("Finish this match and publish its result?")) return;

    setFinishingId(matchId);
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize", side: "home" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to finish match.");
      setMatches((current) => current.map((match) => match.id === matchId ? { ...match, status: "COMPLETED" } : match));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to finish match.");
    } finally {
      setFinishingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Match history</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Matches Played</h1>
            <p className="mt-2 text-sm text-zinc-500">Review your matches and continue any unfinished scorecard.</p>
          </div>
          <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700">{matches.length} match{matches.length === 1 ? "" : "es"}</div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">No matches yet</h2>
          <p className="mt-2 text-sm text-zinc-500">Start a match to build your match history.</p>
          <button type="button" onClick={() => router.push("/start-match")} className="mt-6 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">Start a Match</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <article key={match.id} className="relative rounded-[22px] border border-zinc-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition hover:border-emerald-200 sm:rounded-[28px] sm:p-6">
              <button type="button" onClick={() => void handleDelete(match.id)} disabled={deletingId === match.id} aria-label="Delete match" title="Delete match" className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 sm:right-4 sm:top-4">
                <Trash2 size={17} />
              </button>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <button type="button" onClick={() => router.push(`/matches/${match.id}`)} className="min-w-0 flex-1 pr-12 text-left">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                    <span>{match.category?.replaceAll("_", " ") ?? "Match"}</span>
                    {match.tournamentName ? <><span>•</span><span>{match.tournamentName}</span></> : null}
                    <span>•</span>
                    <span className={match.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}>{match.status === "LIVE" ? "IN PROGRESS" : match.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto_1fr]">
                    <span className="truncate text-base font-semibold text-zinc-900 sm:text-lg">{match.homeName}</span>
                    <span className="row-start-2 text-xs font-medium text-zinc-400 sm:row-start-auto sm:text-sm">vs</span>
                    <span className="truncate text-left text-base font-semibold text-zinc-900 sm:text-right sm:text-lg">{match.awayName}</span>
                    <span className="col-start-2 row-start-1 text-xl font-bold tabular-nums text-zinc-900 sm:col-start-auto sm:row-start-auto sm:text-lg">{match.scoreHome} - {match.scoreAway}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 sm:text-sm">
                    <span>{match.tournamentName ?? "Friendly Match"} · {match.category?.replaceAll("_", " ") ?? "Match"}</span>
                    <span>{formatMatchDate(match.createdAt)}</span>
                  </div>
                </button>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => router.push(`/matches/${match.id}`)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">{match.status === "COMPLETED" ? "Open Scorecard" : "Continue"}</button>
                  {match.status !== "COMPLETED" ? <button type="button" onClick={() => void handleFinish(match.id)} disabled={finishingId === match.id} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50">{finishingId === match.id ? "Finishing…" : "Finish"}</button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}