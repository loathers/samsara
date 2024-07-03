/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Path` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Class" (
    "name" TEXT NOT NULL,
    "id" INTEGER,
    "image" TEXT,
    "pathId" INTEGER,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Path_id_key" ON "Path"("id");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("id") ON DELETE SET NULL ON UPDATE CASCADE;
