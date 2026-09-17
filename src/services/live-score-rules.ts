const DEFAULT_GAME_POINT_TARGET = 21;

export function getGamePointTarget(targetPoints?: number | null) {
  const normalized = Number(targetPoints);
  return [11, 21].includes(normalized) ? normalized : DEFAULT_GAME_POINT_TARGET;
}

export function isGameCompleteForTarget(home: number, away: number, targetPoints = DEFAULT_GAME_POINT_TARGET) {
  const target = getGamePointTarget(targetPoints);
  const leading = Math.max(home, away);
  const trailing = Math.min(home, away);

  if (leading < target) {
    return false;
  }

  return leading - trailing >= 2;
}

export { DEFAULT_GAME_POINT_TARGET };
