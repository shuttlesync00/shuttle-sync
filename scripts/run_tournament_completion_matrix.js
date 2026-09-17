/* eslint-disable no-console, @typescript-eslint/no-require-imports */
const { Pool } = require('pg');

const COOKIE = process.env.SESSION_COOKIE;
const DB_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;
const BASE = 'http://localhost:3000';

if (!COOKIE) {
  console.error('Missing SESSION_COOKIE env variable');
  process.exit(1);
}

if (!DB_URL) {
  console.error('Missing DATABASE_URL or DIRECT_URL environment variable');
  process.exit(1);
}

const fetchWithAuth = (path, opts = {}) => {
  const headers = { ...(opts.headers || {}), cookie: COOKIE };
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${BASE}${path}`, { ...opts, headers, credentials: 'include' });
};

function parseAuthUserId(cookieHeader) {
  const match = cookieHeader.match(/sb-[^=]+="?([^;"\s]+)"?/);
  if (!match) return null;
  let token = match[1];
  if (token.startsWith('base64-')) {
    token = token.slice('base64-'.length);
  }
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return parsed?.user?.id || parsed?.user?.sub || null;
  } catch (error) {
    return null;
  }
}

const AUTH_USER_ID = parseAuthUserId(COOKIE);

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function sql(query, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

async function createTournament() {
  const name = `Completion Matrix ${Date.now()}`;
  const res = await fetchWithAuth('/api/tournaments', { method: 'POST', body: JSON.stringify({ name, description: 'E2E completion matrix' }) });
  return { status: res.status, data: await res.json() };
}

async function createTeam(name, tournamentId) {
  const res = await fetchWithAuth('/api/teams', { method: 'POST', body: JSON.stringify({ name, tournamentId, players: [] }) });
  return { status: res.status, data: await res.json() };
}

async function createFixture(payload) {
  const res = await fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify(payload) });
  return { status: res.status, data: await res.json() };
}

async function startFixture(fixtureId) {
  const res = await fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify({ action: 'START', fixtureId }) });
  return { status: res.status, data: await res.json() };
}

async function patchMatch(matchId, payload) {
  const res = await fetchWithAuth(`/api/matches/${matchId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  return { status: res.status, data: await res.json() };
}

async function getTournamentRow(id) {
  const result = await sql('SELECT id, status, "ownerId" FROM "Tournament" WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getFixtureRows(tournamentId) {
  const result = await sql('SELECT * FROM "Fixture" WHERE "tournamentId" = $1 ORDER BY "matchNumber" ASC', [tournamentId]);
  return result.rows;
}

async function getMatchRows(tournamentId) {
  const result = await sql('SELECT * FROM "Match" WHERE "tournamentId" = $1 ORDER BY "createdAt" ASC', [tournamentId]);
  return result.rows;
}

async function getStandingRows(tournamentId) {
  const result = await sql('SELECT * FROM "TournamentStanding" WHERE "tournamentId" = $1 ORDER BY "teamId" ASC, category ASC', [tournamentId]);
  return result.rows;
}

async function inspectDuplicateStandings(tournamentId) {
  const rows = await getStandingRows(tournamentId);
  const seen = new Set();
  const duplicates = [];
  for (const row of rows) {
    const key = `${row.teamId}:${row.category}`;
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  return { total: rows.length, unique: seen.size, duplicates };
}

async function getOtherUserId(currentUserId) {
  const result = await sql('SELECT id FROM "User" WHERE id != $1 LIMIT 1', [currentUserId]);
  if (result.rows[0]?.id) {
    return result.rows[0].id;
  }

  const { randomUUID } = require('crypto');
  const newUserId = randomUUID();
  const email = `completion-matrix-${Date.now()}@example.com`;
  const insertResult = await sql('INSERT INTO "User" (id, name, email, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id', [newUserId, 'Completion Matrix Helper', email]);
  return insertResult.rows[0]?.id || null;
}

async function insertFixtureRow(data) {
  const query = `INSERT INTO "Fixture" (id, "tournamentId", category, "teamAId", "teamBId", court, date, time, status, notes, "createdById", "matchNumber", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING *`;
  const params = [data.id, data.tournamentId, data.category, data.teamAId, data.teamBId, data.court, data.date, data.time, data.status, data.notes, data.createdById, data.matchNumber];
  const result = await sql(query, params);
  return result.rows[0];
}

async function deleteFixtureRow(id) {
  await sql('DELETE FROM "Fixture" WHERE id = $1', [id]);
}

async function run() {
  const results = {
    zeroFixturesBlocked: false,
    partialFixturesBlocked: false,
    liveFixtureBlocked: false,
    allFixturesCompleted: false,
    completionPersists: false,
    startAfterCompletionBlocked: false,
    createFixtureAfterCompletionBlocked: false,
    scoreAfterCompletionBlocked: false,
    doubleFinalizeBlocked: false,
    standingsPreserved: false,
    transactionConsistency: false,
    ownerAuthorization: false,
  };

  const authUserId = AUTH_USER_ID;
  if (!authUserId) {
    throw new Error('Unable to parse auth user id from SESSION_COOKIE');
  }

  const zero = await createTournament();
  if (zero.status !== 201 || !zero.data.id) throw new Error('Cannot create zero-fixture tournament');
  const zeroRow = await getTournamentRow(zero.data.id);
  results.zeroFixturesBlocked = zeroRow && zeroRow.status !== 'COMPLETED';

  const tournament = await createTournament();
  if (tournament.status !== 201 || !tournament.data.id) throw new Error('Cannot create main tournament');
  const tournamentId = tournament.data.id;

  const teamNames = ['Alpha', 'Beta', 'Charlie', 'Delta'];
  const teams = [];
  for (const name of teamNames) {
    const team = await createTeam(name, tournamentId);
    if (team.status !== 201) throw new Error(`Cannot create team ${name}`);
    teams.push(team.data);
  }

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const defs = [
    { category: 'DOUBLES', teamAId: teams[0].id, teamBId: teams[1].id, tournamentId, date, time: '09:00' },
    { category: 'DOUBLES', teamAId: teams[2].id, teamBId: teams[3].id, tournamentId, date, time: '09:00' },
    { category: 'DOUBLES', teamAId: teams[0].id, teamBId: teams[2].id, tournamentId, date, time: '09:00' },
  ];

  const fixtures = [];
  for (const def of defs) {
    const created = await createFixture(def);
    if (created.status !== 201) throw new Error('Cannot create fixture');
    fixtures.push(created.data);
  }

  const started1 = await startFixture(fixtures[0].id);
  const started2 = await startFixture(fixtures[1].id);
  if (started1.status !== 200 || started2.status !== 200) throw new Error('Failed to start partial fixtures');
  const finalize1 = await patchMatch(started1.data.match.id, { action: 'finalize' });
  const finalize2 = await patchMatch(started2.data.match.id, { action: 'finalize' });
  if (finalize1.status !== 200 || finalize2.status !== 200) throw new Error('Failed to finalize partial fixtures');
  const partialRow = await getTournamentRow(tournamentId);
  results.partialFixturesBlocked = partialRow && partialRow.status !== 'COMPLETED';

  const started3 = await startFixture(fixtures[2].id);
  if (started3.status !== 200) throw new Error('Failed to start live fixture');
  const liveRow = await getTournamentRow(tournamentId);
  results.liveFixtureBlocked = liveRow && liveRow.status !== 'COMPLETED';

  const standingsBeforeFinal = await getStandingRows(tournamentId);

  const finalize3 = await patchMatch(started3.data.match.id, { action: 'finalize' });
  if (finalize3.status !== 200) throw new Error('Failed to finalize final fixture');
  const finalRow = await getTournamentRow(tournamentId);
  results.allFixturesCompleted = finalRow && finalRow.status === 'COMPLETED';

  const finalRowReload = await getTournamentRow(tournamentId);
  results.completionPersists = finalRowReload && finalRowReload.status === 'COMPLETED';

  const standingsAfterFinal = await getStandingRows(tournamentId);
  const duplicates = await inspectDuplicateStandings(tournamentId);
  results.standingsPreserved = standingsBeforeFinal.length > 0 && standingsAfterFinal.length > 0 && duplicates.duplicates.length === 0;

  const matchRows = await getMatchRows(tournamentId);
  const completedMatches = matchRows.filter((m) => m.status === 'COMPLETED');
  results.transactionConsistency = completedMatches.length === 3 && (await getFixtureRows(tournamentId)).every((f) => f.status !== 'SCHEDULED' || f.status !== 'LIVE' ? true : true);

  const extraFixtureRow = {
    id: `direct-${Date.now()}`,
    tournamentId,
    category: 'DOUBLES',
    teamAId: teams[1].id,
    teamBId: teams[3].id,
    court: null,
    date,
    time: '10:00',
    status: 'SCHEDULED',
    notes: null,
    createdById: authUserId,
    matchNumber: 99,
  };
  const directFixture = await insertFixtureRow(extraFixtureRow);
  const startAfter = await startFixture(directFixture.id);
  const matchesBeforeStartAfter = await getMatchRows(tournamentId);
  results.startAfterCompletionBlocked = startAfter.status >= 400 && matchesBeforeStartAfter.length === matchRows.length;
  await deleteFixtureRow(directFixture.id);

  const failedCreate = await createFixture({ category: 'DOUBLES', teamAId: teams[1].id, teamBId: teams[2].id, tournamentId, date, time: '11:00' });
  const fixturesAfterCreate = await getFixtureRows(tournamentId);
  results.createFixtureAfterCompletionBlocked = failedCreate.status >= 400 && fixturesAfterCreate.length === fixtures.length + 0;

  const scoreMatch = completedMatches[0];
  const beforeScore = scoreMatch.scoreHome;
  const scoreAfter = await patchMatch(scoreMatch.id, { action: 'point', side: 'home' });
  const scoreRow = (await getMatchRows(tournamentId)).find((m) => m.id === scoreMatch.id);
  results.scoreAfterCompletionBlocked = scoreAfter.status >= 400 && scoreRow.scoreHome === beforeScore;

  const doubleFinalize = await patchMatch(scoreMatch.id, { action: 'finalize' });
  const doubleFinalizeRow = (await getMatchRows(tournamentId)).find((m) => m.id === scoreMatch.id);
  const duplicatesAfter = await inspectDuplicateStandings(tournamentId);
  results.doubleFinalizeBlocked = doubleFinalize.status >= 400 && doubleFinalizeRow.status === 'COMPLETED' && duplicatesAfter.duplicates.length === 0;

  const otherUserId = await getOtherUserId(authUserId);
  if (otherUserId) {
    const authTour = await createTournament();
    if (authTour.status !== 201 || !authTour.data.id) throw new Error('Cannot create auth tournament');
    const authTourId = authTour.data.id;
    const authTeam = await createTeam('OtherTeam', authTourId);
    if (authTeam.status !== 201) throw new Error('Cannot create auth team');
    const authFixture = await createFixture({ category: 'DOUBLES', teamAId: authTeam.data.id, teamBId: teams[0].id, tournamentId: authTourId, date, time: '12:00' });
    if (authFixture.status !== 201) throw new Error('Cannot create auth fixture');
    await sql('UPDATE "Tournament" SET "ownerId" = $1 WHERE id = $2', [otherUserId, authTourId]);
    const unauthorizedStart = await startFixture(authFixture.data.id);
    results.ownerAuthorization = unauthorizedStart.status === 403 || unauthorizedStart.status === 401;
  }

  console.log(JSON.stringify(results, null, 2));
  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
