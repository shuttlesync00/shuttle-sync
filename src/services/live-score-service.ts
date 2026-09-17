import { prisma } from "@/lib/prisma";
import { getGamePointTarget, isGameCompleteForTarget } from "@/services/live-score-rules";
import { completeTournamentIfReady } from "@/services/tournament-service";
import type { MatchGameScore, MatchRecord, MatchSide } from "@/types/match";
import type { Prisma } from "@prisma/client";

type RawMatchRow = {
  id: string;
  status: string;
  tournamentId: string | null;
  tournament?: { name: string | null } | null;
  category: string | null;
  court: string | null;
  matchNumber: number | null;
  bestOf: number;
  gamePointTarget: number | null;
  currentGame: number;
  scoreHome: number;
  scoreAway: number;
  gameScores: unknown;
  homeTeamId: string | null;
  awayTeamId: string | null;
  playerAId: string | null;
  playerBId: string | null;
  homeTeam?: { name: string | null } | null;
  awayTeam?: { name: string | null } | null;
  playerA?: { fullName: string } | null;
  playerB?: { fullName: string } | null;
  winnerTeamId: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_GAME_POINT_TARGET = 21;

function getWinnerIdentifier(category: string | null, side: MatchSide, homeTeamId: string | null, awayTeamId: string | null, playerAId: string | null, playerBId: string | null) {
  if (category === "SINGLES") {
    return side === "home" ? playerAId : playerBId;
  }

  return side === "home" ? homeTeamId : awayTeamId;
}

function buildInitialGameScores(bestOf: number): MatchGameScore[] {
  return Array.from({ length: bestOf }, () => ({ home: 0, away: 0, completed: false }));
}

function normalizeGameScores(value: unknown, bestOf: number): MatchGameScore[] {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item) => {
      if (typeof item === "object" && item !== null) {
        const cast = item as Record<string, unknown>;
        return {
          home: typeof cast.home === "number" ? cast.home : Number(cast.home) || 0,
          away: typeof cast.away === "number" ? cast.away : Number(cast.away) || 0,
          completed: typeof cast.completed === "boolean" ? cast.completed : Boolean(cast.completed),
        };
      }

      return { home: 0, away: 0, completed: false };
    });
  }

  return buildInitialGameScores(bestOf);
}

function getActiveGameIndex(currentGame: number, gameScores: MatchGameScore[]) {
  const index = Math.min(Math.max(currentGame, 1), gameScores.length) - 1;
  return Math.max(0, Math.min(index, gameScores.length - 1));
}

function findUndoGameIndex(currentGame: number, gameScores: MatchGameScore[]) {
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

function isGameComplete(home: number, away: number, targetPoints?: number | null) {
  return isGameCompleteForTarget(home, away, targetPoints ?? DEFAULT_GAME_POINT_TARGET);
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

function hasMatchWinner(gameScores: Array<{ home: number; away: number; completed: boolean }>, bestOf: number) {
  const results = countGamesWon(gameScores);
  const winsToClose = Math.ceil(bestOf / 2);
  return results.home >= winsToClose || results.away >= winsToClose;
}

function calculateNextGame(currentGame: number, gameScores: Array<{ home: number; away: number; completed: boolean }>) {
  return Math.min(currentGame + 1, gameScores.length);
}

function buildMatchRecord(row: RawMatchRow): MatchRecord {
  return {
    id: row.id,
    status: (row.status === "LIVE" ? "IN_PROGRESS" : row.status) as MatchRecord["status"],
    tournamentId: row.tournamentId,
    tournamentName: row.tournament?.name ?? null,
    category: row.category,
    court: row.court,
    matchNumber: row.matchNumber,
    bestOf: row.bestOf,
    gamePointTarget: row.gamePointTarget ?? DEFAULT_GAME_POINT_TARGET,
    currentGame: row.currentGame,
    scoreHome: row.scoreHome,
    scoreAway: row.scoreAway,
    gameScores: normalizeGameScores(row.gameScores, row.bestOf),
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    homeTeamName: row.homeTeam?.name ?? row.playerA?.fullName ?? null,
    awayTeamName: row.awayTeam?.name ?? row.playerB?.fullName ?? null,
    winnerTeamId: row.winnerTeamId,
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getLiveMatch(matchId: string): Promise<MatchRecord | null> {
  if (!prisma) return null;

  const row = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true },
  });

  if (!row) return null;
  return buildMatchRecord(row);
}

export async function initializeMatchIfNeeded(matchId: string): Promise<MatchRecord | null> {
  if (!prisma) return null;

  const row = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { name: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      playerA: { select: { fullName: true } },
      playerB: { select: { fullName: true } },
    },
  });
  if (!row) return null;

  if (row.status === "LIVE") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "IN_PROGRESS" } });
    row.status = "IN_PROGRESS";
  }

  const gameScores = normalizeGameScores(row.gameScores, row.bestOf);

  if (row.status !== "COMPLETED" && hasMatchWinner(gameScores, row.bestOf)) {
    const results = countGamesWon(gameScores);
    const winningSide: MatchSide = results.home >= Math.ceil(row.bestOf / 2) ? "home" : "away";
    const winnerTeamId = getWinnerIdentifier(row.category, winningSide, row.homeTeamId, row.awayTeamId, row.playerAId, row.playerBId);

    if (winnerTeamId) {
      const completed = await prisma.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED", winnerTeamId },
        include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true },
      });
      return buildMatchRecord(completed);
    }
  }

  if (row.gameScores) {
    return buildMatchRecord(row);
  }

  const jsonGameScores = gameScores as unknown as Prisma.InputJsonValue;
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { gameScores: jsonGameScores },
    include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true },
  });

  return buildMatchRecord(updated);
}

export async function updateMatchScore(matchId: string, side: MatchSide) {
  if (!prisma) return null;

  const row = await prisma.match.findUnique({ where: { id: matchId } });
  if (!row) return null;
  if (row.status === "COMPLETED") {
    throw new Error("Match already completed.");
  }

  const gameScores = normalizeGameScores(row.gameScores, row.bestOf);
  if (hasMatchWinner(gameScores, row.bestOf)) {
    throw new Error("Match is already decided. Complete the match to publish results.");
  }

  const currentIndex = getActiveGameIndex(row.currentGame, gameScores);
  const currentGame = { ...gameScores[currentIndex] };
  const gamePointTarget = getGamePointTarget(row.gamePointTarget);

  if (row.status === "SCHEDULED") {
    throw new Error("Match not started; start match before scoring.");
  }

  if (side === "home") {
    currentGame.home += 1;
  } else {
    currentGame.away += 1;
  }

  currentGame.home = Math.max(0, currentGame.home);
  currentGame.away = Math.max(0, currentGame.away);

  gameScores[currentIndex] = currentGame;

  let nextStatus = row.status === "LIVE" ? "IN_PROGRESS" : row.status;
  let nextGame = row.currentGame;
  let winnerTeamId = row.winnerTeamId;
  let endedAt = row.endedAt;

  if (isGameComplete(currentGame.home, currentGame.away, gamePointTarget)) {
    currentGame.completed = true;
    gameScores[currentIndex] = currentGame;

    const results = countGamesWon(gameScores);
    const winsToClose = Math.ceil(row.bestOf / 2);

    if (results.home >= winsToClose || results.away >= winsToClose) {
      const winnerSide = results.home >= winsToClose ? "home" : "away";
      nextStatus = "COMPLETED";
      winnerTeamId = getWinnerIdentifier(row.category, winnerSide, row.homeTeamId, row.awayTeamId, row.playerAId, row.playerBId);
      endedAt = new Date();
      nextGame = row.currentGame;
    } else {
      nextGame = calculateNextGame(row.currentGame, gameScores);
    }
  }

  const nextGameIndex = getActiveGameIndex(nextGame, gameScores);
  const nextScore = gameScores[nextGameIndex];
  const jsonGameScores = gameScores as unknown as Prisma.InputJsonValue;
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreHome: nextScore.home,
      scoreAway: nextScore.away,
      currentGame: nextGame,
      status: nextStatus,
      winnerTeamId,
      gamePointTarget,
      gameScores: jsonGameScores,
      startedAt: row.startedAt ?? new Date(),
      endedAt,
    },
    include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true },
  });

  return buildMatchRecord(updated);
}

export async function undoMatchPoint(matchId: string, side: MatchSide) {
  if (!prisma) return null;

  const row = await prisma.match.findUnique({ where: { id: matchId } });
  if (!row) return null;
  if (row.status === "COMPLETED") {
    throw new Error("Match already completed.");
  }
  if (row.status === "SCHEDULED") {
    throw new Error("Match not started; cannot undo points on a scheduled match.");
  }

  const gameScores = normalizeGameScores(row.gameScores, row.bestOf);
  const currentIndex = findUndoGameIndex(row.currentGame, gameScores);
  const currentGame = { ...gameScores[currentIndex] };

  if (side === "home") {
    currentGame.home = Math.max(0, currentGame.home - 1);
  } else {
    currentGame.away = Math.max(0, currentGame.away - 1);
  }

  if (currentGame.completed) {
    currentGame.completed = false;
    // do not change match status here; keep it as LIVE
    row.winnerTeamId = null;
    row.endedAt = null;
  }

  gameScores[currentIndex] = currentGame;
  const activeScore = gameScores[currentIndex];

  const jsonGameScores = gameScores as unknown as Prisma.InputJsonValue;
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreHome: activeScore.home,
      scoreAway: activeScore.away,
      currentGame: currentIndex + 1,
      status: row.status === "LIVE" ? "IN_PROGRESS" : row.status,
      winnerTeamId: row.winnerTeamId,
      gameScores: jsonGameScores,
      endedAt: row.endedAt,
    },
    include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true },
  });

  return buildMatchRecord(updated);
}

export async function finalizeMatch(matchId: string) {
  if (!prisma) return null;

  const row = await prisma.match.findUnique({ where: { id: matchId } });
  if (!row) return null;
  if (row.status === "COMPLETED") {
    throw new Error("Match already completed.");
  }

  const gameScores = normalizeGameScores(row.gameScores, row.bestOf);
  const results = countGamesWon(gameScores);
  const totalHomePoints = gameScores.reduce((sum, game) => sum + game.home, 0);
  const totalAwayPoints = gameScores.reduce((sum, game) => sum + game.away, 0);

  let winnerSide: MatchSide;
  if (results.home > results.away) {
    winnerSide = "home";
  } else if (results.away > results.home) {
    winnerSide = "away";
  } else if (totalHomePoints > totalAwayPoints) {
    winnerSide = "home";
  } else if (totalAwayPoints > totalHomePoints) {
    winnerSide = "away";
  } else {
    throw new Error("Cannot finalize a tied match. The winning side must have more points.");
  }
  const winnerTeamId = getWinnerIdentifier(row.category, winnerSide, row.homeTeamId, row.awayTeamId, row.playerAId, row.playerBId);
  if (!winnerTeamId) throw new Error("Unable to identify the winning player or team.");

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "COMPLETED",
      winnerTeamId,
      endedAt: new Date(),
    },
    include: { tournament: true, homeTeam: true, awayTeam: true },
  });

  return buildMatchRecord(updated);
}

export async function finalizeMatchTransactional(matchId: string) {
  if (!prisma) return null;

  const original = await prisma.match.findUnique({ where: { id: matchId } });
  if (!original) return null;
  if (original.status === "COMPLETED") {
    throw new Error("Match already completed.");
  }

  const gameScores = normalizeGameScores(original.gameScores, original.bestOf);
  const results = countGamesWon(gameScores);
  const totalHomePoints = gameScores.reduce((sum, game) => sum + game.home, 0);
  const totalAwayPoints = gameScores.reduce((sum, game) => sum + game.away, 0);

  let winnerSide: MatchSide;
  if (results.home > results.away) {
    winnerSide = "home";
  } else if (results.away > results.home) {
    winnerSide = "away";
  } else if (totalHomePoints > totalAwayPoints) {
    winnerSide = "home";
  } else if (totalAwayPoints > totalHomePoints) {
    winnerSide = "away";
  } else {
    throw new Error("Cannot finalize a tied match. The winning side must have more points.");
  }
  const winnerTeamId = getWinnerIdentifier(original.category, winnerSide, original.homeTeamId, original.awayTeamId, original.playerAId, original.playerBId);
  if (!winnerTeamId) throw new Error("Unable to identify the winning player or team.");

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED", winnerTeamId, endedAt: new Date() },
    });

    if (!updatedMatch.tournamentId) return updatedMatch;

    const completed = await tx.match.findMany({ where: { tournamentId: updatedMatch.tournamentId, status: "COMPLETED" } });

    const standingsMap = new Map<string, { tournamentId: string; category: string; teamId: string; played: number; won: number; lost: number; gamesWon: number; gamesLost: number; pointsFor: number; pointsAgainst: number }>();

    for (const m of completed) {
      if (!m.homeTeamId || !m.awayTeamId) continue;

      const gScores = normalizeGameScores(m.gameScores, m.bestOf);
      const counted = countGamesWon(gScores);
      const homeGames = counted.home;
      const awayGames = counted.away;
      const homePoints = gScores.reduce((s, g) => s + (g.home ?? 0), 0);
      const awayPoints = gScores.reduce((s, g) => s + (g.away ?? 0), 0);
      const category = m.category ?? "DEFAULT";

      const keyHome = `${category}::${m.homeTeamId}`;
      const home = standingsMap.get(keyHome) ?? { tournamentId: updatedMatch.tournamentId, category, teamId: m.homeTeamId, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, pointsFor: 0, pointsAgainst: 0 };
      home.played += 1;
      if (homeGames > awayGames) home.won += 1; else home.lost += 1;
      home.gamesWon += homeGames;
      home.gamesLost += awayGames;
      home.pointsFor += homePoints;
      home.pointsAgainst += awayPoints;
      standingsMap.set(keyHome, home);

      const keyAway = `${category}::${m.awayTeamId}`;
      const away = standingsMap.get(keyAway) ?? { tournamentId: updatedMatch.tournamentId, category, teamId: m.awayTeamId, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, pointsFor: 0, pointsAgainst: 0 };
      away.played += 1;
      if (awayGames > homeGames) away.won += 1; else away.lost += 1;
      away.gamesWon += awayGames;
      away.gamesLost += homeGames;
      away.pointsFor += awayPoints;
      away.pointsAgainst += homePoints;
      standingsMap.set(keyAway, away);
    }

    for (const [, s] of standingsMap) {
      const pointsDifference = s.pointsFor - s.pointsAgainst;
      const winPercentage = s.played > 0 ? (s.won / s.played) * 100 : 0;

      const existing = await tx.tournamentStanding.findFirst({ where: { tournamentId: s.tournamentId, teamId: s.teamId, category: s.category } });

      if (existing) {
        await tx.tournamentStanding.update({ where: { id: existing.id }, data: { played: s.played, won: s.won, lost: s.lost, gamesWon: s.gamesWon, gamesLost: s.gamesLost, pointsFor: s.pointsFor, pointsAgainst: s.pointsAgainst, pointsDifference, winPercentage } });
      } else {
        await tx.tournamentStanding.create({ data: { tournamentId: s.tournamentId, category: s.category, teamId: s.teamId, played: s.played, won: s.won, lost: s.lost, gamesWon: s.gamesWon, gamesLost: s.gamesLost, pointsFor: s.pointsFor, pointsAgainst: s.pointsAgainst, pointsDifference, winPercentage } });
      }
    }

    // mark the related fixture as COMPLETED if it exists
    try {
      const fixture = await tx.fixture.findFirst({
        where: {
          tournamentId: updatedMatch.tournamentId ?? undefined,
          matchNumber: updatedMatch.matchNumber ?? undefined,
          OR: [
            { teamAId: updatedMatch.homeTeamId, teamBId: updatedMatch.awayTeamId },
            { teamAId: updatedMatch.awayTeamId, teamBId: updatedMatch.homeTeamId },
          ],
        },
      });

      if (fixture) {
        await tx.fixture.update({ where: { id: fixture.id }, data: { status: "COMPLETED" } });
      }
    } catch {
      // ignore fixture update errors to avoid blocking standings update
    }

    // attempt to complete the tournament if ready
    try {
      if (updatedMatch.tournamentId) {
        const tour = await tx.tournament.findUnique({ where: { id: updatedMatch.tournamentId } });
        if (tour) {
          await completeTournamentIfReady(updatedMatch.tournamentId, tour.ownerId, tx);
        }
      }
    } catch {
      // ignore completion errors
    }

    return await tx.match.findUnique({ where: { id: matchId }, include: { tournament: true, homeTeam: true, awayTeam: true, playerA: true, playerB: true } });
  });

  if (!updated) return null;
  return buildMatchRecord(updated as RawMatchRow);
}
