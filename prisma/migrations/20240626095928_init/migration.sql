-- CreateEnum
CREATE TYPE "Lifestyle" AS ENUM ('CASUAL', 'SOFTCORE', 'HARDCORE');

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ascension" (
    "ascensionNumber" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dropped" BOOLEAN NOT NULL,
    "abandoned" BOOLEAN NOT NULL,
    "level" INTEGER NOT NULL,
    "class" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "turns" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "familiar" TEXT NOT NULL,
    "familiarPercentage" DOUBLE PRECISION NOT NULL,
    "lifestyle" "Lifestyle" NOT NULL,
    "path" TEXT NOT NULL,
    "extra" JSONB NOT NULL,

    CONSTRAINT "Ascension_pkey" PRIMARY KEY ("ascensionNumber","playerId")
);

-- AddForeignKey
ALTER TABLE "Ascension" ADD CONSTRAINT "Ascension_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
