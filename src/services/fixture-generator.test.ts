import assert from "node:assert/strict";
import test from "node:test";
import { generateFixtures } from "./fixture-generator";

test("round robin generation creates one fixture per pairing across rounds", () => {
  const teams = [
    { id: "team-a", name: "Team A", category: "DOUBLES" as const },
    { id: "team-b", name: "Team B", category: "DOUBLES" as const },
    { id: "team-c", name: "Team C", category: "DOUBLES" as const },
    { id: "team-d", name: "Team D", category: "DOUBLES" as const },
  ];

  const fixtures = generateFixtures({
    tournament: { id: "t1", name: "Test Tournament" },
    teams,
    format: "ROUND_ROBIN",
  });

  assert.equal(fixtures.length, 6);
  assert.deepEqual(
    fixtures.map((fixture) => fixture.round),
    [1, 1, 2, 2, 3, 3],
  );
  assert.equal(fixtures[0].teamAId, "team-a");
  assert.equal(fixtures[0].teamBId, "team-b");
  assert.equal(fixtures[2].teamAId, "team-a");
  assert.equal(fixtures[2].teamBId, "team-c");
});

test("unsupported formats throw a helpful error", () => {
  assert.throws(() => generateFixtures({
    tournament: { id: "t1", name: "Test Tournament" },
    teams: [{ id: "team-a", name: "Team A", category: "DOUBLES" as const }, { id: "team-b", name: "Team B", category: "DOUBLES" as const }],
    format: "KNOCKOUT",
  }), /Round robin only/);
});
