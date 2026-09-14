import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Partial because `discoveredAt` postdates almost every row. A comparison
  // can't match NULL, so the planner still uses it.
  await sql`
    CREATE INDEX IF NOT EXISTS "Ascension_discoveredAt_idx"
    ON "Ascension" ("discoveredAt")
    WHERE "discoveredAt" IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("Ascension_discoveredAt_idx").ifExists().execute();
}
