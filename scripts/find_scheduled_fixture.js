/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL or DIRECT_URL set in environment.');
    process.exit(2);
  }

  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/find_scheduled_fixture.js <email>');
    process.exit(2);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const userRes = await client.query('SELECT id, email FROM "User" WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rows.length === 0) {
      console.error('No user found with email', email);
      process.exit(3);
    }
    const user = userRes.rows[0];

    const fixtureRes = await client.query(`
      SELECT f.* FROM "Fixture" f
      JOIN "Tournament" t ON t.id = f.tournamentId
      WHERE f.status = 'SCHEDULED' AND t.ownerId = $1
      ORDER BY f.createdAt ASC
      LIMIT 1
    `, [user.id]);

    if (fixtureRes.rows.length === 0) {
      console.log(JSON.stringify({ found: false, message: 'No scheduled fixture found for user' }));
      process.exit(0);
    }

    const fixture = fixtureRes.rows[0];
    console.log(JSON.stringify({ found: true, fixture }));
    process.exit(0);
  } catch (err) {
    console.error('Error querying database', err);
    process.exit(4);
  } finally {
    await client.end();
  }
}

main();
