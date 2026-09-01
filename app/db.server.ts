import pg from "pg";
import { Kysely, PostgresDialect, sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import { boardFilter } from "./board.server";
import { Board, DEFAULT_BOARD } from "./boards";
import type { Database, JsonValue, Path } from "./db";
import { LAST_STANDARD_CLASS_ID, Lifestyle, TagType } from "./db";
import { NS13 } from "./utils";

declare global {
  var globalKysely: Kysely<Database>;
}

function createDb() {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });
}

const kysely: Kysely<Database> =
  process.env.NODE_ENV === "production"
    ? createDb()
    : (global.globalKysely ??= createDb());

// ── Exported types ──────────────────────────────────────────────────────────

export type LeaderboardEntry = Awaited<ReturnType<typeof getLeaderboard>>[number];
export type DedicationEntry = Awaited<ReturnType<typeof getDedication>>[number];

// ── Ascension queries ───────────────────────────────────────────────────────

export async function getFrequency({
  path,
  player,
  start = new Date(2005, 6, 9),
  range = 140,
}: {
  path?: { name: string };
  player?: { id: number };
  start?: Date;
  range?: number;
} = {}) {
  const cadence = range < 140 ? "week" : "month";
  const result = await sql<{ date: Date; count: number }>`
    SELECT
      DATE_TRUNC('${sql.raw(cadence)}', "date") AS "date",
      COUNT(*)::integer AS "count"
    FROM "Ascension"
    WHERE "date" < DATE_TRUNC('${sql.raw(cadence)}', NOW())
    AND "date" >= ${start}
    ${path ? sql`AND "pathName" = ${path.name}` : sql``}
    ${player ? sql`AND "playerId" = ${player.id}` : sql``}
    GROUP BY DATE_TRUNC('${sql.raw(cadence)}', "date")
    ORDER BY DATE_TRUNC('${sql.raw(cadence)}', "date") ASC
  `.execute(kysely);
  return result.rows;
}

export async function getPopularity() {
  const truncDay = sql<Date>`DATE_TRUNC('day', "date")`;
  const rows = await kysely
    .selectFrom("Ascension")
    .innerJoin("Path", "Path.name", "Ascension.pathName")
    .select((eb) => [
      truncDay.as("date"),
      "Path.name",
      "Path.slug",
      "Path.image",
      "Ascension.lifestyle",
      eb.fn.countAll<number>().as("count"),
    ])
    .where(truncDay, "<", sql<Date>`DATE_TRUNC('day', NOW())`)
    .where(truncDay, ">=", sql<Date>`DATE_TRUNC('day', NOW() - interval '1 week')`)
    .groupBy(["Path.name", "Ascension.lifestyle", truncDay])
    .orderBy(truncDay, "asc")
    .execute();

  return rows.map((r) => ({
    ...r,
    name: undefined,
    slug: undefined,
    path: { name: r.name, slug: r.slug, image: r.image },
  }));
}

export async function getStat({
  numberOfAscensions,
  path,
}: {
  numberOfAscensions?: number;
  path?: { name: string };
}) {
  const [{ stat }] = (
    await sql<{ stat: number }>`
      SELECT COUNT(*)::integer AS "stat" FROM (
        SELECT "name"
        FROM "Player"
        LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
        WHERE
          ${path ? sql`"Ascension"."pathName" = ${path.name} AND` : sql``}
          "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
          "Ascension"."date" < DATE_TRUNC('day', NOW())
        GROUP BY "Player"."id"
        ${numberOfAscensions === undefined ? sql`` : sql`HAVING COUNT("Ascension"."playerId") >= ${numberOfAscensions}`}
      ) AS sub
    `.execute(kysely)
  ).rows;

  const [{ previousStat }] = (
    await sql<{ previousStat: number }>`
      SELECT COUNT(*)::integer AS "previousStat" FROM (
        SELECT "name"
        FROM "Player"
        LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
        WHERE
          ${path ? sql`"Ascension"."pathName" = ${path.name} AND` : sql``}
          "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
          "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
        GROUP BY "Player"."id"
        ${numberOfAscensions === undefined ? sql`` : sql`HAVING COUNT("Ascension"."playerId") >= ${numberOfAscensions}`}
      ) AS sub
    `.execute(kysely)
  ).rows;

  return [stat, stat / previousStat - 1] as [stat: number, change: number];
}

export async function getRecordBreaking(
  path: Path,
  lifestyle?: Lifestyle,
  board?: string,
) {
  const rows = await kysely
    .selectFrom("Ascension as a")
    .innerJoin("Tag as t", (join) => {
      let j = join
        .onRef("t.ascensionNumber", "=", "a.ascensionNumber")
        .onRef("t.playerId", "=", "a.playerId")
        .on("t.type", "=", "RECORD_BREAKING");
      if (board !== undefined) j = j.on("t.board", "=", board);
      return j;
    })
    .innerJoin("Player as p", "p.id", "a.playerId")
    .select(["a.days", "a.turns", "a.date", "a.lifestyle", "a.extra", "p.id as playerId", "p.name as playerName"])
    .where("a.pathName", "=", path.name)
    .$if(lifestyle !== undefined, (qb) => qb.where("a.lifestyle", "=", lifestyle!))
    .orderBy("a.date", "asc")
    .execute();

  return rows.map((r) => ({
    days: r.days,
    turns: r.turns,
    date: r.date,
    lifestyle: r.lifestyle,
    extra: r.extra,
    player: { id: r.playerId, name: r.playerName },
  }));
}

function toLeaderboardEntry(
  r: {
    ascensionNumber: number;
    date: Date;
    dropped: boolean;
    abandoned: boolean;
    level: number;
    sign: string;
    turns: number;
    days: number;
    lifestyle: Lifestyle;
    extra: JsonValue;
    playerId: number;
    playerName: string;
    className: string | null;
    classId: number | null;
  },
  tags: { value: number | null }[],
) {
  return {
    ascensionNumber: r.ascensionNumber,
    date: r.date,
    dropped: r.dropped,
    abandoned: r.abandoned,
    level: r.level,
    sign: r.sign,
    turns: r.turns,
    days: r.days,
    lifestyle: r.lifestyle,
    extra: r.extra,
    tags,
    player: { id: r.playerId, name: r.playerName },
    class: { id: r.classId ?? null, name: r.className ?? "" },
  };
}

export async function getLeaderboard({
  path,
  lifestyle,
  inSeason,
  type,
  board,
}: {
  path: { name: string; start: Date | null; end: Date | null };
  lifestyle: Lifestyle;
  inSeason?: boolean;
  type?: TagType;
  board?: string;
}) {
  if (inSeason && (!path.start || !path.end)) return [];

  const tagType = type || ((inSeason ? "LEADERBOARD" : "PYRITE") as TagType);

  const rows = await kysely
    .selectFrom("Ascension as a")
    .innerJoin("Tag as t", (join) => {
      let j = join
        .onRef("t.ascensionNumber", "=", "a.ascensionNumber")
        .onRef("t.playerId", "=", "a.playerId")
        .on("t.type", "=", tagType);
      if (board !== undefined) j = j.on("t.board", "=", board);
      return j;
    })
    .innerJoin("Player as p", "p.id", "a.playerId")
    .leftJoin("Class as c", "c.name", "a.className")
    .select([
      "a.ascensionNumber",
      "a.date",
      "a.dropped",
      "a.abandoned",
      "a.level",
      "a.sign",
      "a.turns",
      "a.days",
      "a.lifestyle",
      "a.extra",
      "t.value as tagValue",
      "p.id as playerId",
      "p.name as playerName",
      "c.name as className",
      "c.id as classId",
    ])
    .where("a.pathName", "=", path.name)
    .where("a.lifestyle", "=", lifestyle)
    .orderBy("t.value", "asc")
    .execute();

  return rows.map((r) => toLeaderboardEntry(r, [{ value: r.tagValue }]));
}

export async function getRecentAscensions({
  path,
  lifestyle,
  board,
  limit = 11,
}: {
  path: { name: string };
  lifestyle: Lifestyle;
  /** A date sort rather than a ranking, so there is no tag to carry the board. */
  board?: Board;
  limit?: number;
}) {
  let query = kysely
    .selectFrom("Ascension as a")
    .innerJoin("Player as p", "p.id", "a.playerId")
    .leftJoin("Class as c", "c.name", "a.className")
    .select([
      "a.ascensionNumber",
      "a.date",
      "a.dropped",
      "a.abandoned",
      "a.level",
      "a.sign",
      "a.turns",
      "a.days",
      "a.lifestyle",
      "a.extra",
      "p.id as playerId",
      "p.name as playerName",
      "c.name as className",
      "c.id as classId",
    ])
    .where("a.pathName", "=", path.name)
    .where("a.lifestyle", "=", lifestyle);

  if (board !== undefined) query = query.where(boardFilter(board, "a"));

  const rows = await query
    .orderBy("a.date", "desc")
    .orderBy(sql`"a"."discoveredAt" DESC NULLS LAST`)
    .limit(limit)
    .execute();

  return rows.map((r) => toLeaderboardEntry(r, []));
}

export async function getDedication(
  path: { name: string },
  lifestyle: Lifestyle,
  board: Board = DEFAULT_BOARD,
) {
  return (
    await sql<{ id: number; name: string; runs: number }>`
      SELECT
        "Player".*,
        COUNT("Player"."id")::integer AS "runs"
      FROM "Ascension"
      JOIN "Player" ON "Ascension"."playerId" = "Player"."id"
      WHERE
        "Ascension"."pathName" = ${path.name} AND
        "Ascension"."lifestyle" = ${sql.literal(lifestyle)}::"Lifestyle" AND
        "Ascension"."abandoned" = false AND
        "Ascension"."dropped" = false AND
        ${boardFilter(board, "Ascension")} AND
        "Ascension"."date" > ${NS13}::date
      GROUP BY "Player"."id"
      ORDER BY "runs" DESC
      LIMIT 11
    `.execute(kysely)
  ).rows;
}

export async function countAscensions(pathName?: string, dateBefore?: Date) {
  let query = kysely
    .selectFrom("Ascension")
    .select((eb) => eb.fn.countAll<number>().as("count"));

  if (pathName !== undefined) {
    query = query.where("pathName", "=", pathName);
  }
  if (dateBefore !== undefined) {
    query = query.where("date", "<", dateBefore);
  }

  const { count } = await query.executeTakeFirstOrThrow();
  return Number(count);
}

export async function getRecordsForRSS() {
  const rows = await kysely
    .selectFrom("Ascension as a")
    .innerJoin("Tag as t", (join) =>
      join
        .onRef("t.ascensionNumber", "=", "a.ascensionNumber")
        .onRef("t.playerId", "=", "a.playerId")
        .on("t.type", "=", "RECORD_BREAKING"),
    )
    .innerJoin("Player as p", "p.id", "a.playerId")
    .innerJoin("Path as path", "path.name", "a.pathName")
    .select([
      "a.ascensionNumber",
      "a.days",
      "a.turns",
      "a.date",
      "a.lifestyle",
      "a.extra",
      "t.board",
      "p.id as playerId",
      "p.name as playerName",
      "path.name as pathName",
    ])
    .orderBy("a.date", "desc")
    .execute();

  return rows.map((r) => ({
    ascensionNumber: r.ascensionNumber,
    days: r.days,
    turns: r.turns,
    date: r.date,
    lifestyle: r.lifestyle,
    extra: r.extra,
    board: r.board,
    player: { id: r.playerId, name: r.playerName },
    path: { name: r.pathName },
  }));
}

export async function getPyritesWithAscensions() {
  const rows = await kysely
    .selectFrom("Tag as t")
    .innerJoin("Ascension as a", (join) =>
      join
        .onRef("a.ascensionNumber", "=", "t.ascensionNumber")
        .onRef("a.playerId", "=", "t.playerId"),
    )
    .innerJoin("Player as p", "p.id", "a.playerId")
    .innerJoin("Path as path", "path.name", "a.pathName")
    .select([
      "t.type",
      "t.board",
      "a.ascensionNumber",
      "a.days",
      "a.turns",
      "a.lifestyle",
      "a.extra",
      "a.date",
      "a.dropped",
      "a.abandoned",
      "p.id as playerId",
      "p.name as playerName",
      "path.name as pathName",
      "path.id as pathId",
      "path.slug as pathSlug",
      "path.image as pathImage",
      "path.seasonal as pathSeasonal",
      "path.start as pathStart",
      "path.end as pathEnd",
    ])
    .where("t.type", "=", "PYRITE")
    .where("t.value", "=", 1)
    .where((eb) =>
      eb.not(eb.and([eb("path.id", "=", 999), eb("a.lifestyle", "=", "SOFTCORE")])),
    )
    .orderBy("path.id", "desc")
    .execute();

  return rows.map((r) => ({
    type: r.type,
    board: r.board,
    ascension: {
      ascensionNumber: r.ascensionNumber,
      days: r.days,
      turns: r.turns,
      lifestyle: r.lifestyle,
      extra: r.extra,
      date: r.date,
      dropped: r.dropped,
      abandoned: r.abandoned,
      player: { id: r.playerId, name: r.playerName },
      path: {
        name: r.pathName,
        id: r.pathId,
        slug: r.pathSlug,
        image: r.pathImage,
        seasonal: r.pathSeasonal,
        start: r.pathStart,
        end: r.pathEnd,
      },
    },
  }));
}

export async function countAscensionsByPath() {
  return kysely
    .selectFrom("Ascension")
    .select((eb) => ["pathName", eb.fn.countAll<number>().as("_count")])
    .groupBy("pathName")
    .execute();
}

export async function countAscensionsInSeasonByPath() {
  return kysely
    .selectFrom("Ascension")
    .innerJoin("Path", "Path.name", "Ascension.pathName")
    .select((eb) => ["Ascension.pathName", eb.fn.countAll<number>().as("_count")])
    .whereRef("Ascension.date", "<=", "Path.end")
    .groupBy("Ascension.pathName")
    .execute();
}

export async function getTortoisecoreRun(lifestyle: Lifestyle) {
  const row = await kysely
    .selectFrom("Ascension as a")
    .innerJoin("Player as p", "p.id", "a.playerId")
    .select([
      "a.playerId",
      "a.ascensionNumber",
      "a.days",
      "a.turns",
      "a.lifestyle",
      "a.date",
      "p.id as pId",
      "p.name as playerName",
    ])
    .where("a.pathName", "=", "None")
    .where("a.abandoned", "=", false)
    .where("a.dropped", "=", false)
    .where("a.date", ">", NS13)
    .where("a.lifestyle", "=", lifestyle)
    .orderBy("a.turns", "asc")
    .orderBy("a.days", "asc")
    .limit(1)
    .executeTakeFirst();

  if (!row) return null;
  return {
    playerId: row.playerId,
    ascensionNumber: row.ascensionNumber,
    days: row.days,
    turns: row.turns,
    lifestyle: row.lifestyle,
    date: row.date,
    player: { id: row.pId, name: row.playerName },
  };
}

export async function getLongestRun(
  unit: "turns" | "days",
  lifestyle: "SOFTCORE" | "HARDCORE",
) {
  const base = kysely
    .selectFrom("Ascension as a")
    .innerJoin("Player as p", "p.id", "a.playerId")
    .select([
      "a.playerId",
      "a.ascensionNumber",
      "a.days",
      "a.turns",
      "a.lifestyle",
      "a.date",
      "p.id as pId",
      "p.name as playerName",
    ])
    .where("a.lifestyle", "=", lifestyle)
    .where("a.abandoned", "=", false)
    .where("a.dropped", "=", false)
    .where("a.date", ">", NS13)
    .limit(1);

  const row = await (
    unit === "turns"
      ? base.orderBy("a.turns", "desc")
      : base.orderBy("a.days", "desc")
  ).executeTakeFirst();

  if (!row) return null;
  return {
    playerId: row.playerId,
    ascensionNumber: row.ascensionNumber,
    days: row.days,
    turns: row.turns,
    lifestyle: row.lifestyle,
    date: row.date,
    player: { id: row.pId, name: row.playerName },
  };
}

/** The tagger only records ranks up to 35. */
export const CLASS_COMPARISON_RANK_CUTOFF = 30;

const CLASS_COMPARISON_LIFESTYLES = [Lifestyle.SOFTCORE, Lifestyle.HARDCORE];

/** The class being measured plus at least three others. */
const MIN_CLASSES_PER_PLAYER = 4;

export type ClassComparisonRow = {
  /** The Standard season, or null on boards that are not bucketed by year. */
  year: number | null;
  lifestyle: Lifestyle;
  className: string;
  classImage: string | null;
  /** Fraction of the board's runs that used this class. */
  share: number;
  /** Null when too few players ran several classes to compare within them. */
  winRate: number | null;
  turnDelta: number | null;
};

/**
 * Two things about class choice on a board: what people actually pick (`share`), and how
 * those picks fare (`winRate`).
 *
 * Share counts every qualifying player, because a class nobody ran is the finding on paths
 * where one class dominates. Win rate needs a player who ran several classes, so it scores
 * every run pairwise against that player's other-class runs, days before turns, and averages
 * within a player before across them so the grinders do not carry it. It is null where too
 * few players explored.
 *
 * `window` bounds the comparison. Omit it for Standard, whose boards carry a year each and
 * bucket into calendar years; pass one for a path's season or for all time.
 *
 * `board` has to restrict the untagged runs too, or a player's runs on another board would
 * be compared against their runs on this one.
 */
export async function getClassComparison({
  path,
  tagType = TagType.LEADERBOARD,
  window,
  board,
}: {
  path: { name: string };
  tagType?: TagType;
  /** `end` is exclusive. */
  window?: { start: Date; end: Date; year?: number };
  board?: Board;
}) {
  const lifestyles = sql.join(
    CLASS_COMPARISON_LIFESTYLES.map((l) => sql`${sql.literal(l)}::"Lifestyle"`),
  );

  // Kept non-null so the joins below match; the final select turns 0 back into null.
  // Without a window the boards are Standard's years, so the key is a number.
  const season = window
    ? sql`${window.year ?? 0}::integer`
    : sql`"Tag"."board"::integer`;
  const seasonStart = window
    ? sql`${window.start}`
    : sql`MAKE_DATE("qualifying"."season", 1, 1)`;
  const seasonEnd = window
    ? sql`${window.end}`
    : sql`MAKE_DATE("qualifying"."season" + 1, 1, 1)`;

  const result = await sql<ClassComparisonRow>`
    WITH "qualifying" AS (
      SELECT DISTINCT
        ${season} AS "season",
        "Ascension"."lifestyle" AS "lifestyle",
        "Ascension"."playerId" AS "playerId"
      FROM "Tag"
      JOIN "Ascension"
        ON "Ascension"."ascensionNumber" = "Tag"."ascensionNumber"
        AND "Ascension"."playerId" = "Tag"."playerId"
      WHERE
        "Tag"."type" = ${sql.literal(tagType)}::"TagType" AND
        ${window ? sql`` : sql`"Tag"."board" ~ '^\\d+$' AND`}
        ${board?.key ? sql`"Tag"."board" = ${board.key} AND` : sql``}
        "Tag"."value" <= ${CLASS_COMPARISON_RANK_CUTOFF} AND
        "Ascension"."pathName" = ${path.name} AND
        "Ascension"."lifestyle" IN (${lifestyles})
    ),
    -- Tagged or not, since the tagger keeps only each player's best run.
    "playerRuns" AS (
      SELECT
        "qualifying"."season" AS "season",
        "qualifying"."lifestyle" AS "lifestyle",
        "qualifying"."playerId" AS "playerId",
        "Ascension"."className" AS "className",
        "Ascension"."days" AS "days",
        "Ascension"."turns" AS "turns"
      FROM "qualifying"
      JOIN "Ascension"
        ON "Ascension"."playerId" = "qualifying"."playerId"
        AND "Ascension"."lifestyle" = "qualifying"."lifestyle"
        AND "Ascension"."date" >= ${seasonStart}
        AND "Ascension"."date" < ${seasonEnd}
      WHERE
        "Ascension"."pathName" = ${path.name} AND
        "Ascension"."dropped" IS FALSE AND
        "Ascension"."abandoned" IS FALSE AND
        ${board ? sql`${boardFilter(board, "Ascension")} AND` : sql``}
        -- A run left dormant for years would otherwise land in a season it was never
        -- played in. Day 1 is the start day.
        "Ascension"."date" - (("Ascension"."days" - 1) * INTERVAL '1 day')
          >= ${seasonStart}
    ),
    -- Before the exploration filter, so a class only the unadventurous ran still counts.
    "runsByClass" AS (
      SELECT
        "season", "lifestyle", "className",
        COUNT(*)::float
          / SUM(COUNT(*)) OVER (PARTITION BY "season", "lifestyle") AS "share"
      FROM "playerRuns"
      GROUP BY "season", "lifestyle", "className"
    ),
    -- Only paths without classes of their own get compared, so every board is open to the
    -- six starting classes and a class nobody picked should read as an empty bar rather
    -- than a missing one. The union still matters: a few runs carry a path's class on a
    -- path that does not grant it.
    "boardClass" AS (
      SELECT "name" FROM "Class" WHERE "id" BETWEEN 1 AND ${LAST_STANDARD_CLASS_ID}
      UNION
      SELECT "className" FROM "runsByClass"
    ),
    "share" AS (
      SELECT
        "bucket"."season", "bucket"."lifestyle", "boardClass"."name" AS "className",
        COALESCE("runsByClass"."share", 0) AS "share"
      FROM (SELECT DISTINCT "season", "lifestyle" FROM "runsByClass") AS "bucket"
      CROSS JOIN "boardClass"
      LEFT JOIN "runsByClass"
        ON "runsByClass"."season" = "bucket"."season"
        AND "runsByClass"."lifestyle" = "bucket"."lifestyle"
        AND "runsByClass"."className" = "boardClass"."name"
    ),
    -- Ranking twice counts how many other-class runs each run beats. Measured 4x faster
    -- than the self join it replaces, which the planner cannot cost and rescans per row.
    "ranked" AS (
      SELECT
        "season", "lifestyle", "playerId", "className", "days", "turns",
        MIN("days") OVER w AS "bestDays",
        COUNT(*) OVER w AS "cntAll",
        RANK() OVER (PARTITION BY "season", "lifestyle", "playerId"
                     ORDER BY "days", "turns") AS "rankAll",
        COUNT(*) OVER (PARTITION BY "season", "lifestyle", "playerId",
                                    "days", "turns") AS "tiesAll",
        COUNT(*) OVER wc AS "cntClass",
        RANK() OVER (PARTITION BY "season", "lifestyle", "playerId", "className"
                     ORDER BY "days", "turns") AS "rankClass",
        COUNT(*) OVER (PARTITION BY "season", "lifestyle", "playerId", "className",
                                    "days", "turns") AS "tiesClass",
        -- COUNT(DISTINCT) is not a window function; ranking from both ends and adding is.
        DENSE_RANK() OVER (PARTITION BY "season", "lifestyle", "playerId"
                           ORDER BY "className")
          + DENSE_RANK() OVER (PARTITION BY "season", "lifestyle", "playerId"
                               ORDER BY "className" DESC)
          - 1 AS "classesPlayed"
      FROM "playerRuns"
      WINDOW
        w AS (PARTITION BY "season", "lifestyle", "playerId"),
        wc AS (PARTITION BY "season", "lifestyle", "playerId", "className")
    ),
    "perRun" AS (
      SELECT
        "season", "lifestyle", "playerId", "className", "days", "turns", "bestDays",
        "cntAll" - "cntClass" AS "others",
        ("cntAll" - ("rankAll" - 1) - "tiesAll")
          - ("cntClass" - ("rankClass" - 1) - "tiesClass") AS "beats",
        "tiesAll" - "tiesClass" AS "draws"
      FROM "ranked"
      WHERE "classesPlayed" >= ${MIN_CLASSES_PER_PLAYER}
    ),
    "winRate" AS (
      SELECT
        "season", "lifestyle", "playerId", "className",
        AVG(("beats" + 0.5 * "draws") / "others") AS "winRate"
      FROM "perRun"
      WHERE "others" > 0
      GROUP BY "season", "lifestyle", "playerId", "className"
    ),
    -- Turns only mean anything at a fixed daycount.
    "atBestDay" AS (
      SELECT
        "season", "lifestyle", "playerId", "className",
        SUM("turns"::float) OVER wc AS "classTurns",
        COUNT(*) OVER wc AS "classN",
        SUM("turns"::float) OVER w AS "allTurns",
        COUNT(*) OVER w AS "allN"
      FROM "perRun"
      WHERE "days" = "bestDays" AND "others" > 0
      WINDOW
        w AS (PARTITION BY "season", "lifestyle", "playerId"),
        wc AS (PARTITION BY "season", "lifestyle", "playerId", "className")
    ),
    "turnsVsOthers" AS (
      SELECT DISTINCT
        "season", "lifestyle", "playerId", "className",
        "classTurns" / "classN"
          - ("allTurns" - "classTurns") / NULLIF("allN" - "classN", 0) AS "turnDelta"
      FROM "atBestDay"
    ),
    "byClass" AS (
      SELECT
        "season", "lifestyle", "className",
        AVG("winRate")::float AS "winRate"
      FROM "winRate"
      GROUP BY "season", "lifestyle", "className"
    ),
    "turnByClass" AS (
      SELECT
        "season", "lifestyle", "className",
        AVG("turnDelta")::float AS "turnDelta"
      FROM "turnsVsOthers"
      GROUP BY "season", "lifestyle", "className"
    )
    SELECT
      NULLIF("share"."season", 0)::integer AS "year",
      "share"."lifestyle" AS "lifestyle",
      "share"."className" AS "className",
      "Class"."image" AS "classImage",
      "share"."share"::float AS "share",
      "byClass"."winRate" AS "winRate",
      "turnByClass"."turnDelta" AS "turnDelta"
    FROM "share"
    LEFT JOIN "byClass"
      USING ("season", "lifestyle", "className")
    LEFT JOIN "turnByClass"
      USING ("season", "lifestyle", "className")
    LEFT JOIN "Class" ON "Class"."name" = "share"."className"
    -- Class id is the canonical in-game class order.
    ORDER BY "year" DESC NULLS LAST, "lifestyle" ASC, "Class"."id" ASC NULLS LAST
  `.execute(kysely);

  return result.rows;
}

// ── Player queries ──────────────────────────────────────────────────────────

export async function findPlayerByName(name: string) {
  return kysely
    .selectFrom("Player")
    .selectAll()
    .where(sql`lower("name")`, "=", name.toLowerCase())
    .executeTakeFirst();
}

export async function findPlayerWithAscensions(id: number) {
  return kysely
    .selectFrom("Player as p")
    .select((eb) => [
      "p.id",
      "p.name",
      jsonArrayFrom(
        eb
          .selectFrom("Ascension as a")
          .select((eb2) => [
            "a.ascensionNumber",
            "a.playerId",
            "a.date",
            "a.dropped",
            "a.abandoned",
            "a.level",
            "a.className",
            "a.sign",
            "a.turns",
            "a.days",
            "a.familiarName",
            "a.familiarPercentage",
            "a.lifestyle",
            "a.pathName",
            "a.extra",
            jsonObjectFrom(
              eb2
                .selectFrom("Path")
                .select(["name", "slug", "image"])
                .whereRef("Path.name", "=", "a.pathName"),
            ).$notNull().as("path"),
            jsonObjectFrom(
              eb2
                .selectFrom("Class")
                .select(["name", "image"])
                .whereRef("Class.name", "=", "a.className"),
            ).$notNull().as("class"),
            jsonArrayFrom(
              eb2
                .selectFrom("Tag as tag")
                .select(["tag.type", "tag.value", "tag.board"])
                .whereRef("tag.ascensionNumber", "=", "a.ascensionNumber")
                .whereRef("tag.playerId", "=", "a.playerId"),
            ).as("tags"),
            jsonObjectFrom(
              eb2
                .selectFrom("Familiar")
                .selectAll()
                .whereRef("Familiar.name", "=", "a.familiarName"),
            ).as("familiar"),
          ])
          .whereRef("a.playerId", "=", "p.id")
          .orderBy("a.ascensionNumber", "asc"),
      ).as("ascensions"),
    ])
    .where("p.id", "=", id)
    .executeTakeFirst();
}

// ── Path queries ────────────────────────────────────────────────────────────

export async function getPaths() {
  return kysely
    .selectFrom("Path")
    .selectAll()
    .orderBy(sql`"id" DESC NULLS LAST`)
    .orderBy("name", "asc")
    .execute();
}

export async function findPath({
  slug,
  id,
}: {
  slug?: string;
  id?: number;
}) {
  let query = kysely.selectFrom("Path").selectAll();

  if (slug !== undefined && id !== undefined) {
    query = query.where((eb) =>
      eb.or([eb("slug", "=", slug), eb("id", "=", id)]),
    );
  } else if (slug !== undefined) {
    query = query.where("slug", "=", slug);
  } else if (id !== undefined) {
    query = query.where("id", "=", id);
  }

  return query.executeTakeFirst();
}

export async function findPathWithClasses({
  slug,
  id,
}: {
  slug?: string;
  id?: number;
}) {
  let query = kysely.selectFrom("Path").select((eb) => [
    "name",
    "slug",
    "start",
    "end",
    "id",
    "image",
    "seasonal",
    jsonArrayFrom(
      eb
        .selectFrom("Class")
        .selectAll()
        .whereRef("Class.pathId", "=", "Path.id"),
    ).as("class"),
  ]);

  if (slug !== undefined && id !== undefined) {
    query = query.where((eb) =>
      eb.or([eb("slug", "=", slug), eb("id", "=", id)]),
    );
  } else if (slug !== undefined) {
    query = query.where("slug", "=", slug);
  } else if (id !== undefined) {
    query = query.where("id", "=", id);
  }

  return query.executeTakeFirst();
}

// ── Misc ────────────────────────────────────────────────────────────────────

export async function getMaxAge() {
  const row = await kysely
    .selectFrom("Setting")
    .select("value")
    .where("key", "=", "nextUpdate")
    .executeTakeFirst();

  if (!row?.value) return 1800;
  const secondsLeft = Math.ceil((Number(row.value) - Date.now()) / 1000);
  return Math.max(0, secondsLeft);
}
