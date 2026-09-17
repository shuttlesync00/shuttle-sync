ALTER TABLE "Player" ADD COLUMN "normalizedPhone" TEXT;

UPDATE "Player"
SET "phoneNumber" = CASE
  WHEN regexp_replace("phoneNumber", '[^0-9]', '', 'g') LIKE '91%' AND length(regexp_replace("phoneNumber", '[^0-9]', '', 'g')) = 12
    THEN '+91' || right(regexp_replace("phoneNumber", '[^0-9]', '', 'g'), 10)
  WHEN length(regexp_replace("phoneNumber", '[^0-9]', '', 'g')) = 10
    THEN '+91' || regexp_replace("phoneNumber", '[^0-9]', '', 'g')
  ELSE "phoneNumber"
END
WHERE "phoneNumber" IS NOT NULL;

UPDATE "Player" SET "normalizedPhone" = "phoneNumber" WHERE "phoneNumber" IS NOT NULL;

DO $$
DECLARE
  duplicate RECORD;
BEGIN
  FOR duplicate IN
    SELECT "normalizedPhone", min("id") AS keeper
    FROM "Player"
    WHERE "normalizedPhone" IS NOT NULL
    GROUP BY "normalizedPhone"
    HAVING count(*) > 1
  LOOP
    DELETE FROM "TeamPlayer" duplicate_team_player
    USING "TeamPlayer" keeper_team_player
    WHERE duplicate_team_player."playerId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    )
      AND keeper_team_player."teamId" = duplicate_team_player."teamId"
      AND keeper_team_player."playerId" = duplicate.keeper;

    UPDATE "TeamPlayer"
    SET "playerId" = duplicate.keeper
    WHERE "playerId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    );

    UPDATE "Match"
    SET "playerAId" = duplicate.keeper
    WHERE "playerAId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    );
    UPDATE "Match"
    SET "playerBId" = duplicate.keeper
    WHERE "playerBId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    );
    UPDATE "Fixture"
    SET "playerAId" = duplicate.keeper
    WHERE "playerAId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    );
    UPDATE "Fixture"
    SET "playerBId" = duplicate.keeper
    WHERE "playerBId" IN (
      SELECT "id" FROM "Player" WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper
    );

    DELETE FROM "Player"
    WHERE "normalizedPhone" = duplicate."normalizedPhone" AND "id" <> duplicate.keeper;
  END LOOP;
END $$;

DELETE FROM "TeamPlayer" duplicate_team_player
USING "TeamPlayer" keeper_team_player
WHERE duplicate_team_player."id" > keeper_team_player."id"
  AND duplicate_team_player."teamId" = keeper_team_player."teamId"
  AND duplicate_team_player."playerId" = keeper_team_player."playerId";

CREATE UNIQUE INDEX "Player_normalizedPhone_key" ON "Player"("normalizedPhone");
CREATE UNIQUE INDEX "TeamPlayer_teamId_playerId_key" ON "TeamPlayer"("teamId", "playerId");
