-- AddForeignKey
ALTER TABLE "Ascension" ADD CONSTRAINT "Ascension_pathName_fkey" FOREIGN KEY ("pathName") REFERENCES "Path"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
