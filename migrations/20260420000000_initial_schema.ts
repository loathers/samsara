import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS unaccent`.execute(db);

  await sql`
    DO $$ BEGIN
      CREATE TYPE "Lifestyle" AS ENUM ('CASUAL', 'SOFTCORE', 'HARDCORE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `.execute(db);

  await sql`
    DO $$ BEGIN
      CREATE TYPE "TagType" AS ENUM (
        'RECORD_BREAKING', 'PERSONAL_BEST', 'LEADERBOARD', 'PYRITE',
        'LEADERBOARD_SPECIAL', 'PYRITE_SPECIAL', 'STANDARD'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `.execute(db);

  await db.schema
    .createTable("Setting")
    .ifNotExists()
    .addColumn("key", "text", (c) => c.primaryKey())
    .addColumn("value", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("Player")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("name", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("Path")
    .ifNotExists()
    .addColumn("name", "text", (c) => c.primaryKey())
    .addColumn("slug", "text", (c) => c.notNull().unique())
    .addColumn("start", sql`TIMESTAMP(3)`)
    .addColumn("end", sql`TIMESTAMP(3)`)
    .addColumn("id", "integer", (c) => c.unique())
    .addColumn("image", "text")
    .addColumn("seasonal", "boolean", (c) => c.notNull().defaultTo(true))
    .execute();

  await db.schema
    .createTable("Class")
    .ifNotExists()
    .addColumn("name", "text", (c) => c.primaryKey())
    .addColumn("id", "integer")
    .addColumn("image", "text")
    .addColumn("pathId", "integer", (c) =>
      c.references("Path.id").onDelete("set null").onUpdate("cascade"),
    )
    .execute();

  await db.schema
    .createTable("Familiar")
    .ifNotExists()
    .addColumn("name", "text", (c) => c.primaryKey())
    .addColumn("image", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("Ascension")
    .ifNotExists()
    .addColumn("ascensionNumber", "integer", (c) => c.notNull())
    .addColumn("playerId", "integer", (c) =>
      c
        .notNull()
        .references("Player.id")
        .onDelete("restrict")
        .onUpdate("cascade"),
    )
    .addColumn("date", sql`TIMESTAMP(3)`, (c) => c.notNull())
    .addColumn("dropped", "boolean", (c) => c.notNull())
    .addColumn("abandoned", "boolean", (c) => c.notNull())
    .addColumn("level", "integer", (c) => c.notNull())
    .addColumn("className", "text", (c) =>
      c
        .notNull()
        .references("Class.name")
        .onDelete("restrict")
        .onUpdate("cascade"),
    )
    .addColumn("sign", "text", (c) => c.notNull())
    .addColumn("turns", "integer", (c) => c.notNull())
    .addColumn("days", "integer", (c) => c.notNull())
    .addColumn("familiarName", "text", (c) =>
      c.references("Familiar.name").onDelete("set null").onUpdate("cascade"),
    )
    .addColumn("familiarPercentage", "double precision", (c) => c.notNull())
    .addColumn("lifestyle", sql`"Lifestyle"`, (c) => c.notNull())
    .addColumn("pathName", "text", (c) =>
      c
        .notNull()
        .references("Path.name")
        .onDelete("restrict")
        .onUpdate("cascade"),
    )
    .addColumn("extra", "jsonb", (c) => c.notNull())
    .addPrimaryKeyConstraint("Ascension_pkey", ["ascensionNumber", "playerId"])
    .execute();

  await db.schema
    .createTable("Tag")
    .ifNotExists()
    .addColumn("type", sql`"TagType"`, (c) => c.notNull())
    .addColumn("value", "integer")
    .addColumn("year", "integer")
    .addColumn("ascensionNumber", "integer", (c) => c.notNull())
    .addColumn("playerId", "integer", (c) => c.notNull())
    .addPrimaryKeyConstraint("Tag_pkey", ["type", "ascensionNumber", "playerId"])
    .addForeignKeyConstraint(
      "Tag_ascensionNumber_playerId_fkey",
      ["ascensionNumber", "playerId"],
      "Ascension",
      ["ascensionNumber", "playerId"],
    )
    .execute();

  await db.schema
    .createIndex("Ascension_pathName_idx")
    .ifNotExists()
    .on("Ascension")
    .column("pathName")
    .using("hash")
    .execute();

  await db.schema
    .createIndex("Ascension_days_turns_idx")
    .ifNotExists()
    .on("Ascension")
    .columns(["days", "turns"])
    .execute();

  await db.schema
    .createIndex("Ascension_date_idx")
    .ifNotExists()
    .on("Ascension")
    .column("date")
    .execute();

  await db.schema
    .createIndex("Ascension_pathName_lifestyle_date_idx")
    .ifNotExists()
    .on("Ascension")
    .columns(["pathName", "lifestyle", "date"])
    .execute();

  await db.schema
    .createIndex("Ascension_playerId_pathName_lifestyle_idx")
    .ifNotExists()
    .on("Ascension")
    .columns(["playerId", "pathName", "lifestyle"])
    .execute();

  await db.schema
    .createIndex("Tag_type_year_idx")
    .ifNotExists()
    .on("Tag")
    .columns(["type", "year"])
    .execute();

  await sql`
    CREATE OR REPLACE FUNCTION public.slugify(v TEXT) RETURNS TEXT
      LANGUAGE plpgsql STRICT IMMUTABLE AS $$
    BEGIN
      RETURN trim(BOTH '-' FROM regexp_replace(lower(unaccent(trim(v))), '[^a-z0-9_-]+', '-', 'gi'));
    END;
    $$
  `.execute(db);

  await sql`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("Tag").ifExists().execute();
  await db.schema.dropTable("Ascension").ifExists().execute();
  await db.schema.dropTable("Familiar").ifExists().execute();
  await db.schema.dropTable("Class").ifExists().execute();
  await db.schema.dropTable("Path").ifExists().execute();
  await db.schema.dropTable("Player").ifExists().execute();
  await db.schema.dropTable("Setting").ifExists().execute();
  await sql`DROP TYPE IF EXISTS "TagType"`.execute(db);
  await sql`DROP TYPE IF EXISTS "Lifestyle"`.execute(db);
}
