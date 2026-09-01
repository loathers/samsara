import { type Kysely, sql } from "kysely";

// Tag.year only ever discriminated Standard's per-year boards. Generalise it into a
// board key, so any path that ranks several cohorts side by side can use the same
// column — see app/boards.ts.

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("Tag").addColumn("board", "text").execute();

  await sql`UPDATE "Tag" SET "board" = "year"::text WHERE "year" IS NOT NULL`.execute(
    db,
  );

  await db.schema.alterTable("Tag").dropColumn("year").execute();

  await db.schema.dropIndex("Tag_type_year_idx").ifExists().execute();

  await db.schema
    .createIndex("Tag_type_board_idx")
    .ifNotExists()
    .on("Tag")
    .columns(["type", "board"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("Tag").addColumn("year", "integer").execute();

  // Lossy: boards that are not years have nowhere to go in the old column. Re-running
  // the tagger restores them.
  await sql`UPDATE "Tag" SET "year" = "board"::integer WHERE "board" ~ '^\\d+$'`.execute(
    db,
  );

  await db.schema.alterTable("Tag").dropColumn("board").execute();

  await db.schema.dropIndex("Tag_type_board_idx").ifExists().execute();

  await db.schema
    .createIndex("Tag_type_year_idx")
    .ifNotExists()
    .on("Tag")
    .columns(["type", "year"])
    .execute();
}
