/* eslint-disable no-console, @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COOKIE = process.env.SESSION_COOKIE;
const BASE = 'http://localhost:3000';

if (!COOKIE) {
  console.error('Missing SESSION_COOKIE env variable');
  process.exit(1);
}

const fetchWithAuth = (path, opts = {}) => {
  const headers = { ...(opts.headers || {}), cookie: COOKIE };
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${BASE}${path}`, { ...opts, headers, credentials: 'include' });
};

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { text }; }
}

async function createTournament() {
  const name = `Test Completion ${Date.now()}`;
  const res = await fetchWithAuth('/api/tournaments', { method: 'POST', body: JSON.stringify({ name, description: 'E2E test tournament' }) });
  return { status: res.status, data: await json(res) };
}

async function createTeam(name, tournamentId) {
  const res = await fetchWithAuth('/api/teams', { method: 'POST', body: JSON.stringify({ name, tournamentId, players: [] }) });
  return { status: res.status, data: await json(res) };
}

async function createFixture(payload) {
  const res = await fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify(payload) });
  return { status: res.status, data: await json(res) };
}

async function startFixture(fixtureId) {
  const res = await fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify({ action: 'START', fixtureId }) });
  return { status: res.status, data: await json(res) };
}

async function patchMatch(matchId, payload) {
  const res = await fetchWithAuth(`/api/matches/${matchId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  return { status: res.status, data: await json(res) };
}

async function getTournament(tournamentId) {
  return prisma.tournament.findUnique({ where: { id: tournamentId } });
}

async function getFixtures(tournamentId) {
  return prisma.fixture.findMany({ where: { tournamentId }, orderBy: [{ matchNumber: 'asc' }] });
}

async function getMatches(tournamentId) {
  return prisma.match.findMany({ where: { tournamentId }, orderBy: [{ createdAt: 'asc' }] });
}

async function getStandings(tournamentId) {
  return prisma.tournamentStanding.findMany({ where: { tournamentId }, orderBy: [{ teamId: 'asc' }, { category: 'asc' }] });
}

async function inspectDuplicateStandings(tournamentId) {
  const rows = await prisma.tournamentStanding.findMany({ where: { tournamentId } });
  const seen = new Set();
  const duplicates = [];
  rows.forEach((row) => {
    const key = `${row.teamId}:${row.category}`;
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  });
  return { total: rows.length, unique: seen.size, duplicates };
}

async function run() {
  const results = {};
  const tour = await createTournament();
  if (tour.status !== 201 || !tour.data.id) {
    console.error('Failed to create tournament', tour.status, tour.data);
    process.exit(1);
  }
  const tournamentId = tour.data.id;
  console.log('Tournament:', tournamentId);

  const teamNames = ['Alpha', 'Beta', 'Charlie', 'Delta'];
  const teams = [];
  for (const name of teamNames) {
    const team = await createTeam(name, tournamentId);
    if (team.status !== 201) {
      console.error('Failed to create team', name, team);
      process.exit(1);
    }
    teams.push(team.data);
  }

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const fixtures = [];
  const fixtureDefs = [
    { category: 'DOUBLES', teamAId: teams[0].id, teamBId: teams[1].id, date, time: '09:00', tournamentId },
    { category: 'DOUBLES', teamAId: teams[2].id, teamBId: teams[3].id, date, time: '09:00', tournamentId },
    { category: 'DOUBLES', teamAId: teams[0].id, teamBId: teams[2].id, date, time: '09:00', tournamentId },
  ];

  for (const def of fixtureDefs) {
    const created = await createFixture(def);
    if (created.status !== 201) {
      console.error('Failed creating fixture', def, created);
      process.exit(1);
    }
    fixtures.push(created.data);
  }

  const zeroTour = await createTournament();
  if (zeroTour.status !== 201) {
    console.error('Failed to create zero-fixtures tournament', zeroTour);
    process.exit(1);
  }
  const zeroId = zeroTour.data.id;
  const zeroRow = await getTournament(zeroId);
  results.zeroFixtures = zeroRow && zeroRow.status !== 'COMPLETED';

  const started1 = await startFixture(fixtures[0].id);
  const started2 = await startFixture(fixtures[1].id);
  if (started1.status !== 200 || started2.status !== 200) {
    console.error('Failed to start fixtures for partial completion', started1, started2);
    process.exit(1);
  }
  const finalize1 = await patchMatch(started1.data.match.id, { action: 'finalize' });
  const finalize2 = await patchMatch(started2.data.match.id, { action: 'finalize' });
  if (finalize1.status !== 200 || finalize2.status !== 200) {
    console.error('Failed to finalize partial fixtures', finalize1, finalize2);
    process.exit(1);
  }
  const partialTour = await getTournament(tournamentId);
  results.partialFixtures = partialTour && partialTour.status !== 'COMPLETED';

  const started3 = await startFixture(fixtures[2].id);
  if (started3.status !== 200) {
    console.error('Failed to start live fixture', started3);
    process.exit(1);
  }
  const liveTour = await getTournament(tournamentId);
  results.liveFixture = liveTour && liveTour.status !== 'COMPLETED';

  const finalize3 = await patchMatch(started3.data.match.id, { action: 'finalize' });
  if (finalize3.status !== 200) {
    console.error('Failed to finalize final fixture', finalize3);
    process.exit(1);
  }
  const finalTour = await getTournament(tournamentId);
  results.allCompleted = finalTour && finalTour.status === 'COMPLETED';

  const reloadedTour = await getTournament(tournamentId);
  results.persistence = reloadedTour && reloadedTour.status === 'COMPLETED';

  const beforeStandings = await getStandings(tournamentId);
  results.standingsPreserved = beforeStandings.length > 0;

  const dupCheck = await inspectDuplicateStandings(tournamentId);
  results.noDuplicateStandings = dupCheck.total === dupCheck.unique;

  const completedMatches = await getMatches(tournamentId);
  const completedMatchCount = completedMatches.filter((m) => m.status === 'COMPLETED').length;
  results.matchCountMatchesCompleted = completedMatchCount === 3;

  const fixturesAfter = await getFixtures(tournamentId);
  results.noCompletedMatchWithScheduledFixture = fixturesAfter.every((f) => f.status !== 'SCHEDULED' || !completedMatches.some((m) => m.homeTeamId === f.teamAId && m.awayTeamId === f.teamBId && m.status === 'COMPLETED'));
  results.noCompletedTournamentWithPendingFixtures = fixturesAfter.every((f) => !['SCHEDULED', 'LIVE'].includes(f.status)) && finalTour.status === 'COMPLETED';

  const extraFixture = await createFixture({ category: 'DOUBLES', teamAId: teams[1].id, teamBId: teams[3].id, date, time: '10:00', tournamentId });
  if (extraFixture.status !== 201) {
    console.error('Failed to create extra fixture before completion check', extraFixture);
    process.exit(1);
  }
  const startAfter = await startFixture(extraFixture.data.id);
  const postFixtures = await getFixtures(tournamentId);
  const startedExtra = postFixtures.find((f) => f.id === extraFixture.data.id);
  results.startAfterCompletion = startAfter.status >= 400 && (!startedExtra || startedExtra.status !== 'LIVE');

  const fixtureCountAfter = postFixtures.length;
  const failedCreate = await createFixture({ category: 'DOUBLES', teamAId: teams[1].id, teamBId: teams[2].id, date, time: '11:00', tournamentId });
  const fixtureCountNow = (await getFixtures(tournamentId)).length;
  results.createAfterCompletion = failedCreate.status >= 400 && fixtureCountNow === fixtureCountAfter;

  const someMatch = completedMatches[0];
  const beforeScore = someMatch.scoreHome;
  const scoreAfter = await patchMatch(someMatch.id, { action: 'point', side: 'home' });
  const currentMatch = await prisma.match.findUnique({ where: { id: someMatch.id } });
  results.scoreAfterCompletion = scoreAfter.status >= 400 && currentMatch && currentMatch.scoreHome === beforeScore;

  const doubleFinalize = await patchMatch(someMatch.id, { action: 'finalize' });
  const lateMatch = await prisma.match.findUnique({ where: { id: someMatch.id } });
  const standingsAfterDouble = await inspectDuplicateStandings(tournamentId);
  results.doubleFinalize = doubleFinalize.status >= 400 && standingsAfterDouble.duplicates.length === 0 && lateMatch.status === 'COMPLETED';

  const afterStandings = await getStandings(tournamentId);
  results.standingsPreserved = results.standingsPreserved && afterStandings.length === beforeStandings.length;
  const deterministic = afterStandings.every((row, idx) => {
    if (idx === 0) return true;
    const prev = afterStandings[idx - 1];
    if (prev.won !== row.won) return prev.won >= row.won;
    if (prev.pointsDifference !== row.pointsDifference) return prev.pointsDifference >= row.pointsDifference;
    if (prev.gamesWon !== row.gamesWon) return prev.gamesWon >= row.gamesWon;
    return prev.team.name <= row.team.name;
  });
  results.deterministicRanking = deterministic;

  const unauthorizedAttempt = await fetchWithAuth('/api/fixtures', { method: 'POST', body: JSON.stringify({ action: 'START', fixtureId: fixtures[0].id, ownerId: 'fake-owner' }) });
  results.ownerAuthorization = unauthorizedAttempt.status !== 200;

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('ERROR', err);
  await prisma.$disconnect();
  process.exit(1);
});
