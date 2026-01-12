-- CreateIndex
CREATE INDEX "Ascension_date_idx" ON "Ascension"("date");

-- CreateIndex
CREATE INDEX "Ascension_pathName_lifestyle_date_idx" ON "Ascension"("pathName", "lifestyle", "date");

-- CreateIndex
CREATE INDEX "Ascension_playerId_pathName_lifestyle_idx" ON "Ascension"("playerId", "pathName", "lifestyle");

-- CreateIndex
CREATE INDEX "Tag_type_year_idx" ON "Tag"("type", "year");
