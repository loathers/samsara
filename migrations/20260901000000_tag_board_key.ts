import { type Kysely, sql } from "kysely";

// A run now holds one tag per board rather than one per type (see app/boards.ts). The
// board is null for single-board paths, so it cannot join a primary key; uniqueness moves
// to an index over its coalesced value.

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE "Tag" DROP CONSTRAINT "Tag_pkey"`.execute(db);

  await sql`
    CREATE UNIQUE INDEX "Tag_type_ascensionNumber_playerId_board_key"
      ON "Tag" ("type", "ascensionNumber", "playerId", COALESCE("board", ''))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Lossy: a run ranked on two boards has two rows and the old key holds one of them.
  await sql`
    DELETE FROM "Tag"
    WHERE "ctid" IN (
      SELECT "ctid" FROM (
        SELECT "ctid", ROW_NUMBER() OVER (
          PARTITION BY "type", "ascensionNumber", "playerId"
        ) AS "copy"
        FROM "Tag"
      ) t WHERE t."copy" > 1
    )
  `.execute(db);

  await sql`DROP INDEX IF EXISTS "Tag_type_ascensionNumber_playerId_board_key"`.execute(
    db,
  );

  await sql`
    ALTER TABLE "Tag"
      ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("type", "ascensionNumber", "playerId")
  `.execute(db);
}
