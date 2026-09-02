import { type Kysely, sql } from "kysely";

// The special rankings and Standard's seasons are boards now (see app/boards.ts), so three
// of the seven types went unwritten. Their rows go here rather than in the tagger's delete,
// which would otherwise name the retired scheme on every run forever.

const LIVE = ["RECORD_BREAKING", "PERSONAL_BEST", "LEADERBOARD", "PYRITE"];
const RETIRED = ["LEADERBOARD_SPECIAL", "PYRITE_SPECIAL", "STANDARD"];

const labels = (values: string[]) =>
  sql.join(values.map((value) => sql.lit(value)));

/** Postgres cannot drop an enum value, so the type is rebuilt around the column. */
async function rebuildTagType(db: Kysely<unknown>, values: string[]) {
  await sql`ALTER TYPE "TagType" RENAME TO "TagType_old"`.execute(db);
  await sql`CREATE TYPE "TagType" AS ENUM (${labels(values)})`.execute(db);
  await sql`
    ALTER TABLE "Tag"
      ALTER COLUMN "type" TYPE "TagType" USING "type"::text::"TagType"
  `.execute(db);
  await sql`DROP TYPE "TagType_old"`.execute(db);
}

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`DELETE FROM "Tag" WHERE "type"::text IN (${labels(RETIRED)})`.execute(
    db,
  );

  await rebuildTagType(db, LIVE);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // The labels come back; the rows they held do not, until something writes them again.
  await rebuildTagType(db, [...LIVE, ...RETIRED]);
}
