"use client";

import { type MatchRecord, type MatchSide } from "@/types/match";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const formatTime = (startedAt?: string | null, endedAt?: string | null) => {
  if (!startedAt) return "00:00";
  const endTime = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diff = Math.max(0, endTime - new Date(startedAt).getTime());
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const buildGameScoreLabel = (scores: Array<{ home: number; away: number; completed: boolean }>) => {
  return scores.map((score, index) => `G${index + 1}: ${score.home}-${score.away}${score.completed ? " ✔" : ""}`).join(" | ");
};

function getActiveGameIndex(currentGame: number, gameScores: Array<{ home: number; away: number; completed: boolean }>) {
  const index = Math.min(Math.max(currentGame, 1), gameScores.length) - 1;
  return Math.max(0, Math.min(index, gameScores.length - 1));
}

function findUndoGameIndex(currentGame: number, gameScores: Array<{ home: number; away: number; completed: boolean }>) {
  const activeIndex = getActiveGameIndex(currentGame, gameScores);
  const activeGame = gameScores[activeIndex];

  if (activeGame.home === 0 && activeGame.away === 0 && activeIndex > 0) {
    for (let index = activeIndex - 1; index >= 0; index -= 1) {
      const previousGame = gameScores[index];
      if (previousGame.home > 0 || previousGame.away > 0 || previousGame.completed) {
        return index;
      }
    }
  }

  return activeIndex;
}

function isGameComplete(home: number, away: number, targetPoints = 21) {
  const normalizedTarget = [11, 21].includes(Number(targetPoints)) ? Number(targetPoints) : 21;
  const leading = Math.max(home, away);
  const trailing = Math.min(home, away);

  if (leading < normalizedTarget) {
    return false;
  }

  return leading - trailing >= 2;
}

function determineGameWinner(home: number, away: number) {
  if (home > away) return "home" as MatchSide;
  if (away > home) return "away" as MatchSide;
  return null;
}

function countGamesWon(gameScores: Array<{ home: number; away: number; completed: boolean }>) {
  return gameScores.reduce(
    (acc, game) => {
      if (!game.completed) return acc;
      if (game.home > game.away) return { home: acc.home + 1, away: acc.away };
      return { home: acc.home, away: acc.away + 1 };
    },
    { home: 0, away: 0 },
  );
}

function calculateNextGame(currentGame: number, gameScores: Array<{ home: number; away: number; completed: boolean }>) {
  return Math.min(currentGame + 1, gameScores.length);
}

function applyPointLocally(match: MatchRecord, side: MatchSide) {
  const gameScores = match.gameScores.map((game) => ({ ...game }));
  const currentIndex = getActiveGameIndex(match.currentGame, gameScores);
  const currentGame = { ...gameScores[currentIndex] };

  if (side === "home") {
    currentGame.home += 1;
  } else {
    currentGame.away += 1;
  }

  currentGame.home = Math.max(0, currentGame.home);
  currentGame.away = Math.max(0, currentGame.away);
  gameScores[currentIndex] = currentGame;

  let nextStatus = match.status;
  let nextGame = match.currentGame;
  let winnerTeamId = match.winnerTeamId;
  let endedAt = match.endedAt;

  if (isGameComplete(currentGame.home, currentGame.away, match.gamePointTarget ?? 21)) {
    currentGame.completed = true;
    gameScores[currentIndex] = currentGame;

    const gameWinner = determineGameWinner(currentGame.home, currentGame.away);
    const results = countGamesWon(gameScores);
    const winsToClose = Math.ceil(match.bestOf / 2);

    if (results.home >= winsToClose || results.away >= winsToClose) {
      nextStatus = "COMPLETED";
      winnerTeamId = gameWinner === "home" ? match.homeTeamId : match.awayTeamId;
      endedAt = new Date().toISOString();
      nextGame = match.currentGame;
    } else {
      nextGame = calculateNextGame(match.currentGame, gameScores);
    }
  }

  const nextIndex = getActiveGameIndex(nextGame, gameScores);
  const nextScore = gameScores[nextIndex];

  return {
    ...match,
    status: nextStatus,
    currentGame: nextGame,
    scoreHome: nextScore.home,
    scoreAway: nextScore.away,
    winnerTeamId,
    endedAt,
    gameScores,
  };
}

function applyUndoLocally(match: MatchRecord, side: MatchSide) {
  const gameScores = match.gameScores.map((game) => ({ ...game }));
  const currentIndex = findUndoGameIndex(match.currentGame, gameScores);
  const currentGame = { ...gameScores[currentIndex] };

  if (side === "home") {
    currentGame.home = Math.max(0, currentGame.home - 1);
  } else {
    currentGame.away = Math.max(0, currentGame.away - 1);
  }

  if (currentGame.completed) {
    currentGame.completed = false;
  }

  gameScores[currentIndex] = currentGame;

  return {
    ...match,
    scoreHome: currentGame.home,
    scoreAway: currentGame.away,
    currentGame: currentIndex + 1,
    gameScores,
    winnerTeamId: currentGame.completed ? match.winnerTeamId : null,
    endedAt: currentGame.completed ? match.endedAt : null,
  };
}

function TeamScoreCard({
  label,
  players,
  score,
}: {
  label: string;
  players: string;
  score: number;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-[32px] border border-zinc-200 bg-white p-5 text-center shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">{label}</p>
        <p className="mt-3 text-lg font-semibold text-zinc-900">{players}</p>
      </div>
      <div className="mt-4 rounded-[32px] bg-emerald-50 px-8 py-6 text-6xl font-bold text-emerald-700">{score}</div>
    </div>
  );
}

function Scoreboard({ match }: { match: MatchRecord }) {
  const homePlayers = match.homeTeamName ?? "Team A";
  const awayPlayers = match.awayTeamName ?? "Team B";

  return (
    <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
      <TeamScoreCard
        label={homePlayers}
        players={homePlayers}
        score={match.scoreHome}
      />
      <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 text-center shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
        <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">Scoreboard</span>
        <div className="text-5xl font-semibold text-zinc-900">{match.scoreHome} - {match.scoreAway}</div>
        <div className="text-sm text-zinc-500">{buildGameScoreLabel(match.gameScores)}</div>
      </div>
      <TeamScoreCard
        label={awayPlayers}
        players={awayPlayers}
        score={match.scoreAway}
      />
    </div>
  );
}

function MobileScoreboard({ match }: { match: MatchRecord }) {
  const completedGames = match.gameScores.slice(0, Math.max(0, match.currentGame - 1)).filter((game) => game.completed);

  return (
    <div className="-mx-4 overflow-hidden border-y border-zinc-200 bg-white px-4 py-5 text-center lg:hidden">
      <div className="border-b border-zinc-200 pb-5">
        <p className="truncate text-center text-sm font-semibold uppercase tracking-[0.18em] text-zinc-600">{match.homeTeamName ?? "Team A"}</p>
        <p className="mt-1 text-center text-7xl font-bold leading-none tabular-nums text-emerald-700">{match.scoreHome}</p>
      </div>
      <div className="flex items-center justify-center gap-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400"><span>Game {match.currentGame}</span><span>{match.scoreHome} - {match.scoreAway}</span></div>
      <div className="border-t border-zinc-200 pt-5">
        <p className="truncate text-center text-sm font-semibold uppercase tracking-[0.18em] text-zinc-600">{match.awayTeamName ?? "Team B"}</p>
        <p className="mt-1 text-center text-7xl font-bold leading-none tabular-nums text-zinc-900">{match.scoreAway}</p>
      </div>
      {completedGames.length ? <div className="mt-5 border-t border-zinc-100 pt-3 text-center text-xs text-zinc-500"><span className="font-semibold text-zinc-700">Games</span><span className="ml-3">{completedGames.map((game) => `${game.home} - ${game.away}`).join("  ·  ")}</span></div> : null}
    </div>
  );
}

export default function MatchScorePage() {
  const router = useRouter();
  const routeParams = useParams();
  const matchId = routeParams?.matchId;
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [timer, setTimer] = useState("00:00");
  const [saving, setSaving] = useState(false);
  const [pendingSide, setPendingSide] = useState<MatchSide | null>(null);
  const [pendingUndoSide, setPendingUndoSide] = useState<MatchSide | null>(null);
  const [lastPointSide, setLastPointSide] = useState<MatchSide | null>(null);
  const [showUndoChoices, setShowUndoChoices] = useState(false);
  const [pendingFinalize, setPendingFinalize] = useState(false);
  const actionQueue = useRef(Promise.resolve());
  const actionSequence = useRef(0);

  useEffect(() => {
    if (!matchId) return;
    async function loadMatch() {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) return;
      const payload = await response.json();
      setMatch(payload);
    }

    void loadMatch();
  }, [matchId]);

  useEffect(() => {
    if (!match?.startedAt) return undefined;

    if (match.status === "COMPLETED" || match.endedAt) {
      const timeout = window.setTimeout(() => {
        setTimer(formatTime(match.startedAt, match.endedAt));
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setTimer(formatTime(match.startedAt, match.endedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.startedAt, match?.endedAt, match?.status]);

  const sendAction = (action: string, side: MatchSide) => {
    if (!match) return;
    const isUndoAction = action === "undo";

    if (action === "point") {
      setMatch((currentMatch) => currentMatch ? applyPointLocally(currentMatch, side) : currentMatch);
      setLastPointSide(side);
    } else if (isUndoAction) {
      setMatch((currentMatch) => currentMatch ? applyUndoLocally(currentMatch, side) : currentMatch);
    }

    const sequence = actionSequence.current + 1;
    actionSequence.current = sequence;
    setSaving(true);
    setPendingSide(isUndoAction ? null : side);
    if (isUndoAction) setPendingUndoSide(side);
    if (!isUndoAction) {
      window.setTimeout(() => setPendingSide(null), 1000);
    }

    actionQueue.current = actionQueue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const response = await fetch(`/api/matches/${matchId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, side }),
          });

          const payload = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(payload?.error ?? "Unable to perform action.");
          }

          if (sequence === actionSequence.current) {
            setMatch(payload);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unable to update match.";
          alert(message);
          const response = await fetch(`/api/matches/${matchId}`);
          if (response.ok && sequence === actionSequence.current) {
            setMatch(await response.json());
          }
        } finally {
          setPendingUndoSide(null);
          if (sequence === actionSequence.current) {
            setSaving(false);
          }
        }
      });
  };

  const completeMatch = async () => {
    if (!match) return;
    if (!window.confirm("Confirm end match and finalize results?")) return;
    setPendingFinalize(true);
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize", side: "home" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to finalize match.");
      setMatch(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to finalize match.";
      alert(message);
      const resp = await fetch(`/api/matches/${matchId}`);
      if (resp.ok) {
        const refreshed = await resp.json();
        setMatch(refreshed);
      }
    } finally {
      setPendingFinalize(false);
    }
  };

  const deleteMatch = async () => {
    if (!match) return;
    if (!window.confirm("Delete this match? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete match.");
      }
      router.push(match.tournamentId ? `/tournaments/${match.tournamentId}` : "/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete match.";
      alert(message);
    }
  };

  const undoPoint = async (side: MatchSide) => {
    try {
      setPendingUndoSide(side);
      const response = await fetch(`/api/matches/${matchId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "undo", side }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to undo point.");
      setMatch(payload);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to undo point.");
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) setMatch(await response.json());
    } finally {
      setPendingUndoSide(null);
    }
  };

  if (!match) {
    return <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">Loading match…</div>;
  }

  const isComplete = match.status === "COMPLETED";
  const homeIdentifier = match.category === "SINGLES" ? match.playerAId : match.homeTeamId;
  const awayIdentifier = match.category === "SINGLES" ? match.playerBId : match.awayTeamId;
  const winnerIdentifier = match.winnerTeamId ?? (isComplete && match.scoreHome !== match.scoreAway
    ? match.scoreHome > match.scoreAway ? homeIdentifier : awayIdentifier
    : null);
  const winnerName = winnerIdentifier === homeIdentifier ? match.homeTeamName : winnerIdentifier === awayIdentifier ? match.awayTeamName : "TBD";
  const loserName = winnerIdentifier === homeIdentifier ? match.awayTeamName : winnerIdentifier === awayIdentifier ? match.homeTeamName : "TBD";
  const scoreMargin = Math.abs(match.scoreHome - match.scoreAway);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-10 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
        <Link href={match.tournamentId ? `/tournaments/${match.tournamentId}` : "/dashboard"} className="inline-flex min-h-10 items-center rounded-full border border-white/20 bg-white px-4 font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900">
          <span className="lg:hidden">← Back</span>
          <span className="hidden lg:inline">← Back to {match.tournamentName ?? "Tournament"}</span>
        </Link>
        <span className="hidden text-zinc-300 lg:inline">/</span>
        <Link href="/dashboard" className="hidden underline underline-offset-4 transition hover:text-white sm:inline">Dashboard</Link>
        <span className="hidden text-zinc-500 sm:inline">›</span>
        <Link href={match.tournamentId ? `/tournaments/${match.tournamentId}` : "/dashboard"} className="max-w-[180px] truncate underline underline-offset-4 transition hover:text-white sm:max-w-none">
          {match.tournamentName ?? "Friendly Match"}
        </Link>
        <span className="text-zinc-500">›</span>
        <span className="font-semibold text-white">Live Scoring</span>
      </div>

      <div className="-mx-4 rounded-none border-y border-zinc-200 bg-white p-4 shadow-none sm:mx-0 sm:rounded-[32px] sm:border sm:p-6 sm:shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{match.tournamentName ?? "Friendly Match"}</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">{match.category ?? "Badminton"}</h1>
            <p className="mt-1 text-sm text-zinc-500">Match {match.matchNumber ?? "N/A"} · Game {match.currentGame} <span className="hidden sm:inline">· Elapsed {timer}</span></p>
          </div>
          <div className="self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:self-auto">{match.status}</div>
        </div>

        <div className="mt-4 hidden grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:grid">
          <div className="rounded-2xl bg-zinc-50 p-3 sm:rounded-3xl sm:p-4">
            <p className="text-sm text-zinc-500">Match</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{match.matchNumber ?? "N/A"}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-3 sm:rounded-3xl sm:p-4">
            <p className="text-sm text-zinc-500">Current Game</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{match.currentGame}</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-zinc-50 p-3 sm:col-span-1 sm:rounded-3xl sm:p-4">
            <p className="text-sm text-zinc-500">Elapsed</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{timer}</p>
          </div>
        </div>
      </div>

      <Scoreboard match={match} />
      <MobileScoreboard match={match} />

      {!isComplete ? (
        <div className="-mx-4 space-y-3 border-y border-zinc-200 bg-white px-4 py-5 lg:hidden">
          <button type="button" onClick={() => sendAction("point", "home")} disabled={pendingFinalize || match.status === "COMPLETED"} aria-label={`Add point for ${match.homeTeamName ?? "Team A"}`} className="min-h-14 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60">{pendingSide === "home" ? "Adding…" : `+1 ${match.homeTeamName ?? "Team A"}`}</button>
          <button type="button" onClick={() => sendAction("point", "away")} disabled={pendingFinalize || match.status === "COMPLETED"} aria-label={`Add point for ${match.awayTeamName ?? "Team B"}`} className="min-h-14 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60">{pendingSide === "away" ? "Adding…" : `+1 ${match.awayTeamName ?? "Team B"}`}</button>
          <button type="button" onClick={() => { if (lastPointSide) void undoPoint(lastPointSide); else setShowUndoChoices((visible) => !visible); }} disabled={!!pendingUndoSide || pendingFinalize || match.status === "COMPLETED"} className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60">{pendingUndoSide ? "Undoing…" : "Undo"}</button>
          {showUndoChoices && !lastPointSide ? <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setShowUndoChoices(false); void undoPoint("home"); }} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600">Undo {match.homeTeamName ?? "Team A"}</button><button type="button" onClick={() => { setShowUndoChoices(false); void undoPoint("away"); }} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600">Undo {match.awayTeamName ?? "Team B"}</button></div> : null}
        </div>
      ) : null}

      <div className="-mx-4 rounded-none border-y border-zinc-200 bg-white p-4 shadow-none sm:mx-0 sm:rounded-[32px] sm:border sm:p-6 sm:shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="rounded-2xl bg-zinc-50 p-3 text-center sm:rounded-3xl sm:p-4">
            <p className="text-sm text-zinc-500">Best of</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{match.bestOf}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-3 text-center sm:rounded-3xl sm:p-4">
            <p className="text-sm text-zinc-500">Court</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{match.court ?? "TBD"}</p>
          </div>
        </div>
      </div>

      {isComplete ? (
        <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 text-center shadow-[0_16px_40px_rgba(16,185,129,0.15)]">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600">
            <Trophy size={32} />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Match Complete</p>
          <h2 className="mt-3 text-2xl font-semibold text-emerald-900">{winnerName} defeated {loserName}</h2>
          <p className="mt-2 text-sm text-zinc-600">Final score: {match.scoreHome}-{match.scoreAway}</p>
          <p className="mt-2 text-sm text-zinc-600">{winnerName} won by {scoreMargin} point{scoreMargin === 1 ? "" : "s"}.</p>
          <button onClick={() => router.push(match.tournamentId ? `/tournaments/${match.tournamentId}` : "/dashboard")} className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Return to Tournament</button>
        </div>
      ) : (
        <div className="hidden gap-4 lg:grid lg:grid-cols-2">
          <button type="button" onClick={() => sendAction("point", "home")} disabled={pendingFinalize || match.status === "COMPLETED"} className="rounded-[32px] bg-emerald-500 px-6 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600">
            {pendingSide === "home" ? "Adding…" : "Team A +1"}
          </button>
          <button type="button" onClick={() => sendAction("point", "away")} disabled={pendingFinalize || match.status === "COMPLETED"} className="rounded-[32px] bg-emerald-500 px-6 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600">
            {pendingSide === "away" ? "Adding…" : "Team B +1"}
          </button>
          <button type="button" onClick={() => void undoPoint("home")} disabled={!!pendingUndoSide || pendingFinalize || match.status === "COMPLETED"} className="rounded-[32px] border border-zinc-200 bg-white px-6 py-5 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50">
            {pendingUndoSide === "home" ? "Undoing…" : "Team A Undo"}
          </button>
          <button type="button" onClick={() => void undoPoint("away")} disabled={!!pendingUndoSide || pendingFinalize || match.status === "COMPLETED"} className="rounded-[32px] border border-zinc-200 bg-white px-6 py-5 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50">
            {pendingUndoSide === "away" ? "Undoing…" : "Team B Undo"}
          </button>
        </div>
      )}

      {!isComplete ? (
        <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={completeMatch} disabled={saving} className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">Finish Match</button>
            <button onClick={deleteMatch} className="rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">Delete Match</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
