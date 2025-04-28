-- AlterTable
ALTER TABLE "Ascension" RENAME COLUMN "familiar" TO "familiarName";
ALTER TABLE "Ascension" ALTER COLUMN "familiarName" DROP NOT NULL;

-- UpdateTable
UPDATE "Ascension" SET "familiarName" = NULL WHERE "familiarName" = 'None';

-- CreateTable
CREATE TABLE "Familiar" (
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Familiar_pkey" PRIMARY KEY ("name")
);

-- Populate Table
INSERT INTO "Familiar" ("name", "image")
SELECT DISTINCT "familiarName", 'nopic'
FROM "Ascension"
WHERE "familiarName" IS NOT NULL
  AND "familiarName" NOT IN (SELECT "name" FROM "Familiar");

-- AddForeignKey
ALTER TABLE "Ascension" ADD CONSTRAINT "Ascension_familiarName_fkey"
  FOREIGN KEY ("familiarName") REFERENCES "Familiar"("name")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
