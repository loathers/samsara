import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("Ascension")
    .addColumn("discoveredAt", sql`TIMESTAMP(3)`)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("Ascension").dropColumn("discoveredAt").execute();
}
