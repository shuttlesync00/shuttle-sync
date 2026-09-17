-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentStanding" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    "pointsDifference" INTEGER NOT NULL DEFAULT 0,
    "winPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAnalytics" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "completedMatches" INTEGER NOT NULL DEFAULT 0,
    "remainingMatches" INTEGER NOT NULL DEFAULT 0,
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "totalTeams" INTEGER NOT NULL DEFAULT 0,
    "averageMatchDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "longestMatchDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "highestScore" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tournamentId" TEXT,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "preferredHand" TEXT NOT NULL,
    "playingLevel" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'DOUBLES',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,
    "tournamentId" TEXT,
    "seriesId" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "court" TEXT,
    "matchNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "category" TEXT,
    "court" TEXT,
    "matchNumber" INTEGER,
    "scoreHome" INTEGER NOT NULL DEFAULT 0,
    "scoreAway" INTEGER NOT NULL DEFAULT 0,
    "bestOf" INTEGER NOT NULL DEFAULT 3,
    "currentGame" INTEGER NOT NULL DEFAULT 1,
    "gameScores" JSONB NOT NULL DEFAULT '[]',
    "winnerTeamId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "seriesId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHistory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "PlayerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatistic" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "PlayerStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentStanding_tournamentId_teamId_category_key" ON "TournamentStanding"("tournamentId", "teamId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAnalytics_tournamentId_key" ON "TournamentAnalytics"("tournamentId");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStanding" ADD CONSTRAINT "TournamentStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStanding" ADD CONSTRAINT "TournamentStanding_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAnalytics" ADD CONSTRAINT "TournamentAnalytics_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHistory" ADD CONSTRAINT "PlayerHistory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistic" ADD CONSTRAINT "PlayerStatistic_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

