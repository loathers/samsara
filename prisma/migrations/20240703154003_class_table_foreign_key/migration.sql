/*
  Warnings:

  - You are about to drop the column `class` on the `Ascension` table. All the data in the column will be lost.
  - Added the required column `className` to the `Ascension` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ascension" RENAME COLUMN "class" TO "className";

-- AddForeignKey
ALTER TABLE "Ascension" ADD CONSTRAINT "Ascension_className_fkey" FOREIGN KEY ("className") REFERENCES "Class"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
