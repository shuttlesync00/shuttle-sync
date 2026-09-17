/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
    }
  : undefined;

const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg(new Pool(poolConfig)) })
  : null;

async function main() {
  const tournamentId = process.argv[2];
  if (!tournamentId) {
    console.error('Usage: node upsert_tie_standings.js <tournamentId> <teamId1> <teamId2> <teamId3>');
    process.exit(1);
  }
  const teamIds = process.argv.slice(3);
  if (teamIds.length < 2) {
    console.error('Provide at least two team IDs');
    process.exit(1);
  }

  const category = 'DOUBLES';
  // identical stats for tie
  const payload = { played: 2, won: 1, lost: 1, gamesWon: 2, gamesLost: 2, pointsFor: 40, pointsAgainst: 40 };

  for (const teamId of teamIds) {
    const existing = await prisma.tournamentStanding.findFirst({ where: { tournamentId, teamId, category } });
    const pointsDifference = payload.pointsFor - payload.pointsAgainst;
    const winPercentage = payload.played > 0 ? (payload.won / payload.played) * 100 : 0;
    if (existing) {
      await prisma.tournamentStanding.update({ where: { id: existing.id }, data: { played: payload.played, won: payload.won, lost: payload.lost, gamesWon: payload.gamesWon, gamesLost: payload.gamesLost, pointsFor: payload.pointsFor, pointsAgainst: payload.pointsAgainst, pointsDifference, winPercentage } });
      console.log('updated', teamId);
    } else {
      await prisma.tournamentStanding.create({ data: { tournamentId, category, teamId, played: payload.played, won: payload.won, lost: payload.lost, gamesWon: payload.gamesWon, gamesLost: payload.gamesLost, pointsFor: payload.pointsFor, pointsAgainst: payload.pointsAgainst, pointsDifference, winPercentage } });
      console.log('created', teamId);
    }
  }

  // output current standings order
  const rows = await prisma.tournamentStanding.findMany({ where: { tournamentId, category }, include: { team: true }, orderBy: [{ won: 'desc' }, { pointsDifference: 'desc' }, { gamesWon: 'desc' }] });
  console.log('ordered standings:', rows.map(r => ({ teamId: r.teamId, teamName: r.team.name, won: r.won, pointsDifference: r.pointsDifference, gamesWon: r.gamesWon })));

  // counts to check duplicates
  for (const teamId of teamIds) {
    const cnt = await prisma.tournamentStanding.count({ where: { tournamentId, teamId, category } });
    console.log('count for', teamId, cnt);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
