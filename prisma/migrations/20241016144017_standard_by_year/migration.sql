-- AlterEnum
ALTER TYPE "TagType" ADD VALUE 'STANDARD';

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "year" INTEGER;
