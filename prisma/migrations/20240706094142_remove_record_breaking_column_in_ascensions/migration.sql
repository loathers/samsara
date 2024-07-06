/*
  Warnings:

  - You are about to drop the column `recordBreaking` on the `Ascension` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ascension" DROP COLUMN "recordBreaking";

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_ascensionNumber_playerId_fkey" FOREIGN KEY ("ascensionNumber", "playerId") REFERENCES "Ascension"("ascensionNumber", "playerId") ON DELETE RESTRICT ON UPDATE CASCADE;
