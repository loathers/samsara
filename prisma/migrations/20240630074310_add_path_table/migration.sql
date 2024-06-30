/*
  Warnings:

  - You are about to drop the column `path` on the `Ascension` table. All the data in the column will be lost.
  - Added the required column `pathName` to the `Ascension` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ascension" RENAME COLUMN "path" TO "pathName";

-- CreateTable
CREATE TABLE "Path" (
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "id" INTEGER,
    "image" TEXT,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Path_slug_key" ON "Path"("slug");

-- CreateIndex
CREATE INDEX "Ascension_pathName_idx" ON "Ascension" USING HASH ("pathName");

-- CreateIndex
CREATE INDEX "Ascension_days_turns_idx" ON "Ascension"("days", "turns");
