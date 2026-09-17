/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    }
  : undefined;

const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg(new Pool(poolConfig)) })
  : null;

if (!prisma) {
  console.error('No DATABASE_URL or DIRECT_URL set; aborting tests.');
  process.exit(1);
}

async function upsertStanding(tournamentId, teamId, category, payload) {
  const pointsDifference = payload.pointsFor - payload.pointsAgainst;
  const winPercentage = payload.played > 0 ? (payload.won / payload.played) * 100 : 0;
  const existing = await prisma.tournamentStanding.findFirst({ where: { tournamentId, teamId, category } });
  if (existing) {
    await prisma.tournamentStanding.update({ where: { id: existing.id }, data: { played: payload.played, won: payload.won, lost: payload.lost, gamesWon: payload.gamesWon, gamesLost: payload.gamesLost, pointsFor: payload.pointsFor, pointsAgainst: payload.pointsAgainst, pointsDifference, winPercentage } });
  } else {
    await prisma.tournamentStanding.create({ data: { tournamentId, category, teamId, played: payload.played, won: payload.won, lost: payload.lost, gamesWon: payload.gamesWon, gamesLost: payload.gamesLost, pointsFor: payload.pointsFor, pointsAgainst: payload.pointsAgainst, pointsDifference, winPercentage } });
  }
}

async function ensureTeam(tournamentId, name) {
  const t = await prisma.team.create({ data: { name, category: 'DOUBLES', tournamentId, createdById: 'script' } }).catch(async (err) => {
    // if already exists, try to find by name
    return await prisma.team.findFirst({ where: { name, tournamentId } });
  });
  return t;
}

async function orderedStandings(tournamentId) {
  const rows = await prisma.tournamentStanding.findMany({ where: { tournamentId, category: 'DOUBLES' }, include: { team: true }, orderBy: [{ won: 'desc' }, { pointsDifference: 'desc' }, { gamesWon: 'desc' }, { team: { name: 'asc' } }] });
  return rows.map(r => r.team.name);
}

async function counts(tournamentId, teamIds) {
  const out = {};
  for (const id of teamIds) {
    out[id] = await prisma.tournamentStanding.count({ where: { tournamentId, teamId: id, category: 'DOUBLES' } });
  }
  return out;
}

async function runTests(tournamentId) {
  console.log('Using tournamentId:', tournamentId);

  // create teams
  const A = await ensureTeam(tournamentId, 'Alpha');
  const B = await ensureTeam(tournamentId, 'Beta');
  const C = await ensureTeam(tournamentId, 'Charlie');

  // Test 1: 2 teams tied on numeric fields -> alphabetical
  await upsertStanding(tournamentId, A.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });
  await upsertStanding(tournamentId, B.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });

  let order = await orderedStandings(tournamentId);
  const test1 = order.slice(0,2).join(',') === 'Alpha,Beta';
  console.log('2-team complete tie alphabetical:', test1 ? 'PASS' : 'FAIL', order.slice(0,3));

  // Test 2: 3 teams tied -> alphabetical
  await upsertStanding(tournamentId, C.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });
  order = await orderedStandings(tournamentId);
  const test2 = order.slice(0,3).join(',') === 'Alpha,Beta,Charlie';
  console.log('3-team complete tie alphabetical:', test2 ? 'PASS' : 'FAIL', order.slice(0,3));

  // Test 3: different won -> won takes priority
  await upsertStanding(tournamentId, A.id, 'DOUBLES', { played: 2, won: 2, lost: 0, gamesWon: 4, gamesLost: 0, pointsFor: 44, pointsAgainst: 20 });
  await upsertStanding(tournamentId, B.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });
  await upsertStanding(tournamentId, C.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });
  order = await orderedStandings(tournamentId);
  const test3 = order[0] === 'Alpha';
  console.log('Different won priority preserved:', test3 ? 'PASS' : 'FAIL', order.slice(0,3));

  // Test 4: same won, different pointsDifference -> pointsDifference priority
  await upsertStanding(tournamentId, A.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 50, pointsAgainst: 40 });
  await upsertStanding(tournamentId, B.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 42, pointsAgainst: 40 });
  await upsertStanding(tournamentId, C.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 });
  order = await orderedStandings(tournamentId);
  const test4 = order[0] === 'Alpha' && order[1] === 'Beta' && order[2] === 'Charlie';
  console.log('Points difference priority preserved:', test4 ? 'PASS' : 'FAIL', order.slice(0,3));

  // Test 5: same first two, different gamesWon -> gamesWon priority
  await upsertStanding(tournamentId, A.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 3, gamesLost: 1, pointsFor: 42, pointsAgainst: 40 });
  await upsertStanding(tournamentId, B.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 42, pointsAgainst: 40 });
  await upsertStanding(tournamentId, C.id, 'DOUBLES', { played: 2, won: 1, lost: 1, gamesWon: 1, gamesLost: 3, pointsFor: 42, pointsAgainst: 40 });
  order = await orderedStandings(tournamentId);
  const test5 = order[0] === 'Alpha' && order[1] === 'Beta' && order[2] === 'Charlie';
  console.log('Games won priority preserved:', test5 ? 'PASS' : 'FAIL', order.slice(0,3));

  // Test 6: repeated query -> identical ordering
  const first = await orderedStandings(tournamentId);
  const second = await orderedStandings(tournamentId);
  const test6 = JSON.stringify(first) === JSON.stringify(second);
  console.log('Repeated query identical ordering:', test6 ? 'PASS' : 'FAIL');

  // Test 7: fetch API endpoint twice (requires dev server running)
  let test7 = 'SKIPPED';
  try {
    const fetch = global.fetch || require('node-fetch');
    const url = `http://localhost:3000/api/points-table?tournamentId=${tournamentId}`;
    const a = await fetch(url).then(r => r.json());
    const b = await fetch(url).then(r => r.json());
    const aOrder = (a.standings?.DOUBLES ?? []).map(s => s.teamName);
    const bOrder = (b.standings?.DOUBLES ?? []).map(s => s.teamName);
    test7 = JSON.stringify(aOrder) === JSON.stringify(bOrder) ? 'PASS' : 'FAIL';
  } catch (e) {
    test7 = `ERROR ${e.message}`;
  }
  console.log('API repeated fetch ordering:', test7);

  // Test 8: duplicate standings -> counts must be 1
  const cnts = await counts(tournamentId, [A.id, B.id, C.id]);
  const test8 = Object.values(cnts).every(c => c === 1);
  console.log('Duplicate standings prevention:', test8 ? 'PASS' : 'FAIL', cnts);

  console.log('\nSUMMARY:');
  console.log('2-team complete tie alphabetical:', test1 ? 'PASS' : 'FAIL');
  console.log('3-team complete tie alphabetical:', test2 ? 'PASS' : 'FAIL');
  console.log('Different won priority preserved:', test3 ? 'PASS' : 'FAIL');
  console.log('Points difference priority preserved:', test4 ? 'PASS' : 'FAIL');
  console.log('Games won priority preserved:', test5 ? 'PASS' : 'FAIL');
  console.log('Repeated query identical ordering:', test6 ? 'PASS' : 'FAIL');
  console.log('API repeated fetch ordering:', test7);
  console.log('Duplicate standings prevention:', test8 ? 'PASS' : 'FAIL');
}

const tournamentId = process.argv[2] || 'cmskbu3370000uurx1crt5v8t';
runTests(tournamentId).catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
