-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('RECORD_BREAKING', 'PERSONAL_BEST', 'LEADERBOARD', 'PYRITE');

-- CreateTable
CREATE TABLE "Tag" (
    "type" "TagType" NOT NULL,
    "value" INTEGER,
    "ascensionNumber" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("type","ascensionNumber","playerId")
);
