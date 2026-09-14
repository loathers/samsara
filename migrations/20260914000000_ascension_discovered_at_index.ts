import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // discoveredAt is relatively new, so partial index.
  await sql`
    CREATE INDEX IF NOT EXISTS "Ascension_discoveredAt_idx"
    ON "Ascension" ("discoveredAt")
    WHERE "discoveredAt" IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("Ascension_discoveredAt_idx").ifExists().execute();
}
