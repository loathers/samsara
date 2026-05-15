import { type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Tag PK is (type, ascensionNumber, playerId), so lookups by (ascensionNumber, playerId)
  // in the player ascensions query can't use the PK — add a dedicated index.
  await db.schema
    .createIndex("Tag_playerId_ascensionNumber_idx")
    .ifNotExists()
    .on("Tag")
    .columns(["playerId", "ascensionNumber"])
    .execute();

  // getFrequency for a player filters by (playerId, date) — no index covers this pattern.
  await db.schema
    .createIndex("Ascension_playerId_date_idx")
    .ifNotExists()
    .on("Ascension")
    .columns(["playerId", "date"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("Tag_playerId_ascensionNumber_idx").ifExists().execute();
  await db.schema.dropIndex("Ascension_playerId_date_idx").ifExists().execute();
}
