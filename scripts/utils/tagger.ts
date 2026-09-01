import { sql } from "kysely";

import { boardCase, boardFilter } from "../../app/board.server.js";
import {
  Board,
  DEFAULT_BOARD,
  boardPathNames,
  boardsFor,
  findBoard,
  tagHash,
  yearBoard,
} from "../../app/boards.js";
import { TagType } from "../../app/db.js";
import {
  NS13,
  SITE_URL,
  SPECIAL_RANKINGS,
  pastYearsOfStandard,
} from "../../app/utils.js";
import { db } from "./client.js";

/**
 * These paths should never be ranked by Days / Turns, only by their special ranking.
 */
const NEVER_RANK_BY_TURNCOUNT = ["Grey Goo"];

export async function tagAscensions(sendWebhook: boolean) {
  await tagRecordBreaking();
  await tagPersonalBest();
  await tagPyrites(sendWebhook);
  await tagStandard();
  await tagLeaderboard();
}

function getRecordBreakingQuery() {
  return sql`
    WITH "filteredAscensions" AS (
      SELECT
        "ascensionNumber",
        "playerId",
        "date",
        "days",
        "turns",
        "pathName",
        "lifestyle",
        CASE "pathName"
          WHEN 'Grey Goo' THEN ("extra" ->> 'Goo Score')::bigint
          WHEN 'One Crazy Random Summer' THEN ("extra" ->> 'Fun')::bigint
          ELSE -1 * ("days"::bigint * 1000000::bigint + "turns"::bigint)
        END AS "score",
        ${boardCase()} AS "board"
      FROM
        "Ascension"
      WHERE
        "dropped" = FALSE
        AND "abandoned" = FALSE
        AND "date" >= ${NS13}::date
    ),
    "precedingScore" AS (
      SELECT
        "ascensionNumber",
        "playerId",
        "date",
        "days",
        "turns",
        "pathName",
        "lifestyle",
        "score",
        "board",
        max("score") OVER (PARTITION BY "pathName", "lifestyle", "board" ORDER BY "date" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS "precedingMaxScore"
      FROM
        "filteredAscensions"),
    "rankedRecords" AS (
      SELECT
        "ascensionNumber",
        "playerId",
        "date",
        "days",
        "turns",
        "pathName",
        "lifestyle",
        "score",
        "board",
        "precedingMaxScore",
        ROW_NUMBER() OVER (PARTITION BY "pathName", "lifestyle", "board", "date" ORDER BY "score") AS "rankForDate"
      FROM
        "precedingScore"
      WHERE
        "precedingMaxScore" IS NULL
        OR ("score" > "precedingMaxScore")
    )
    INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId", "board")
    SELECT
      ${TagType.RECORD_BREAKING}::"TagType" AS "type",
      NULL AS "value",
      "ascensionNumber",
      "playerId",
      "board"
    FROM
      "rankedRecords"
    WHERE
      "rankForDate" = 1;
  `;
}

async function tagRecordBreaking() {
  console.timeLog("etl", "Tagging record-breaking ascensions");
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("Tag").where("type", "=", TagType.RECORD_BREAKING).execute();
    await getRecordBreakingQuery().execute(trx);
  });
  console.timeLog("etl", "Finished tagging record-breaking ascensions");
}

function getPersonalBestQuery() {
  return sql`
    WITH "ranked" AS (
      SELECT
        "ascensionNumber",
        "playerId",
        "pathName",
        "lifestyle",
        "days",
        "turns",
        ROW_NUMBER() OVER (
          PARTITION BY "playerId", "pathName", "lifestyle"
          ORDER BY
            CASE "pathName"
              WHEN 'Grey Goo' THEN ("extra" ->> 'Goo Score')::bigint
              WHEN 'One Crazy Random Summer' THEN ("extra" ->> 'Fun')::bigint
              ELSE -1 * ("days"::bigint * 1000000::bigint + "turns"::bigint)
            END DESC
        ) AS "rank"
      FROM
        "Ascension"
      WHERE
        "dropped" = FALSE
        AND "abandoned" = FALSE
    )
    INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId")
    SELECT
      ${TagType.PERSONAL_BEST}::"TagType" AS "type",
      NULL AS "value",
      "ascensionNumber",
      "playerId"
    FROM
      "ranked"
    WHERE
      "rank" = 1;
  `;
}

async function tagPersonalBest() {
  console.timeLog("etl", `Tagging personal bests`);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("Tag").where("type", "=", TagType.PERSONAL_BEST).execute();
    await getPersonalBestQuery().execute(trx);
  });
  console.timeLog("etl", `Finished tagging personal bests`);
}

function getLeaderboardQuery(
  tagType: TagType,
  {
    path,
    inSeason,
    excludePaths,
    extra,
    limit = 35,
    board = DEFAULT_BOARD,
  }: {
    path?: string;
    excludePaths?: string[];
    inSeason?: boolean;
    extra?: string;
    limit?: number;
    /**
     * A board is tagged by its own query, so the other boards' runs are absent from the
     * CTE and the ranks come out per-board without further partitioning.
     */
    board?: Board;
  } = {},
) {
  const order = extra
    ? sql`("extra"->>${extra})::integer DESC`
    : sql`"days" ASC, "turns" ASC`;

  return sql`
    WITH "ranked" AS (
      SELECT
        "pathName",
        "lifestyle",
        "playerId",
        "days",
        "turns",
        "ascensionNumber",
        "extra",
        "date",
        ROW_NUMBER() OVER (PARTITION BY "pathName", "lifestyle", "playerId" ORDER BY ${order}, "date" ASC) AS "rankPerPlayer"
      FROM
        "Ascension"
      LEFT JOIN "Path" on "Ascension"."pathName" = "Path"."name"
      WHERE
      "dropped" IS FALSE
      AND "abandoned" IS FALSE
      ${path ? sql`AND "pathName" = ${path}` : sql``}
      ${inSeason ? sql`AND "date" >= "Path"."start" AND "date" <= "Path"."end"` : sql``}
      ${excludePaths ? sql`AND "pathName" NOT IN (${sql.join(excludePaths)})` : sql``}
      AND ${boardFilter(board)}
      AND "date" >= ${NS13}::date),
    "best" AS (
      SELECT
        "pathName",
        "lifestyle",
        "playerId",
        "days",
        "turns",
        "ascensionNumber",
        "extra",
        "date"
      FROM
        "ranked"
      WHERE
        "rankPerPlayer" = 1),
    "leaderboard" AS (
      SELECT
        "pathName",
        "lifestyle",
        "playerId",
        "days",
        "turns",
        "ascensionNumber",
        "date",
        ROW_NUMBER() OVER (PARTITION BY "pathName", "lifestyle" ORDER BY ${order}, "date" ASC) AS "rank"
      FROM
        "best")
    INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId", "board")
    SELECT
      ${tagType}::"TagType" as "type",
      "rank" as "value",
      "ascensionNumber",
      "playerId",
      ${board.key}::text as "board"
    FROM
      "leaderboard"
    ${limit ? sql`WHERE "rank" <= ${limit}` : sql``}
  `;
}

/** Boards that can never gain a run, whose pyrite would repeat their leaderboard. */
const NO_PYRITE_BOARD = ["11,037 Leagues Under the Sea/pre-nerf"];

function boardQueries(
  tagType: TagType,
  options: Parameters<typeof getLeaderboardQuery>[1],
  skip: string[] = [],
) {
  return boardPathNames().flatMap((path) =>
    boardsFor({ name: path })
      .filter((board) => !skip.includes(`${path}/${board.key}`))
      .map((board) => getLeaderboardQuery(tagType, { ...options, path, board })),
  );
}

async function getBestRuns() {
  const rows = await db
    .selectFrom("Tag")
    .innerJoin("Ascension", (join) =>
      join
        .onRef("Ascension.ascensionNumber", "=", "Tag.ascensionNumber")
        .onRef("Ascension.playerId", "=", "Tag.playerId"),
    )
    .innerJoin("Player", "Player.id", "Ascension.playerId")
    .innerJoin("Path", "Path.name", "Ascension.pathName")
    .select([
      "Ascension.ascensionNumber",
      "Ascension.days",
      "Ascension.turns",
      "Ascension.lifestyle",
      "Ascension.pathName",
      "Tag.type",
      "Tag.board",
      "Path.slug as pathSlug",
      "Player.id as playerId",
      "Player.name as playerName",
    ])
    // A gold per board and per ranking, each its own thing to announce.
    .where("Tag.type", "in", [TagType.PYRITE, TagType.PYRITE_SPECIAL])
    .where("Tag.value", "=", 1)
    .execute();

  return rows.reduce<
    Record<
      string,
      {
        ascensionNumber: number;
        days: number;
        turns: number;
        lifestyle: string;
        pathName: string;
        board: { value: string; label: string } | null;
        url: string;
        player: { id: number; name: string };
      }
    >
  >(
    (acc, { playerId, playerName, type, board, pathSlug, ...rest }) => ({
      ...acc,
      [`${rest.pathName}_${rest.lifestyle}_${type}_${board ?? ""}`]: {
        ...rest,
        board:
          board === null
            ? null
            : // findBoard misses a key left over from an older boards.ts. Naming the
              // raw key beats announcing the gold with no cohort at all.
              { value: board, label: findBoard(rest.pathName, board)?.label ?? board },
        // The link a TagMedal for this tag would use, so both open the same section.
        url: `${SITE_URL}/path/${pathSlug}#${tagHash(type, board)}`,
        player: { id: playerId, name: playerName },
      },
    }),
    {},
  );
}

async function tagPyrites(sendWebhook: boolean) {
  let golds: Awaited<ReturnType<typeof getBestRuns>> = {};

  if (sendWebhook) {
    console.timeLog("etl", "Collecting previous golds");
    golds = await getBestRuns();
    console.timeLog("etl", "Finished collecting previous golds");
  }

  console.timeLog("etl", `Tagging pyrites`);

  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom("Tag")
      .where("type", "in", [TagType.PYRITE, TagType.PYRITE_SPECIAL])
      .execute();

    await Promise.all([
      ...[...SPECIAL_RANKINGS].map(([path, extra]) =>
        getLeaderboardQuery(TagType.PYRITE_SPECIAL, { path, extra }).execute(trx),
      ),
      ...boardQueries(TagType.PYRITE, {}, NO_PYRITE_BOARD).map((q) =>
        q.execute(trx),
      ),
      getLeaderboardQuery(TagType.PYRITE, {
        excludePaths: [...NEVER_RANK_BY_TURNCOUNT, ...boardPathNames()],
      }).execute(trx),
    ]);
  });

  console.timeLog("etl", `Finished tagging pyrites`);

  if (sendWebhook) {
    if (!process.env.OAF_TOKEN) {
      console.timeLog("etl", "No OAF_TOKEN set, skipping OAF webhook");
    } else {
      console.timeLog("etl", "Reporting new golds to OAF webhook");
      for (const [category, run] of Object.entries(await getBestRuns())) {
        const previous = golds[category];
        // A category with no previous gold is new, so there is no change to announce.
        if (
          previous &&
          (run.ascensionNumber !== previous.ascensionNumber ||
            run.player.id !== previous.player.id)
        ) {
          try {
            const result = await fetch(
              `https://oaf.loathers.net/webhooks/samsara?token=${process.env.OAF_TOKEN}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(run),
              },
            );
            if (!result.ok) {
              console.warn(
                "OAF webhook error",
                result.status,
                ":",
                result.statusText,
                await result.text(),
              );
            }
          } catch (error) {
            console.warn("OAF webhook error", error);
          }
        }
      }
    }
    console.timeLog("etl", "Finished reporting new golds to OAF webhook");
  }
}

async function tagLeaderboard() {
  console.timeLog("etl", `Tagging leaderboards`);
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom("Tag")
      .where("type", "in", [TagType.LEADERBOARD, TagType.LEADERBOARD_SPECIAL])
      .execute();

    await Promise.all([
      ...[...SPECIAL_RANKINGS].map(([path, extra]) =>
        getLeaderboardQuery(TagType.LEADERBOARD_SPECIAL, {
          path,
          inSeason: true,
          extra,
        }).execute(trx),
      ),
      ...boardQueries(TagType.LEADERBOARD, {
        inSeason: true,
      }).map((q) => q.execute(trx)),
      getLeaderboardQuery(TagType.LEADERBOARD, {
        inSeason: true,
        excludePaths: [...NEVER_RANK_BY_TURNCOUNT, ...boardPathNames()],
      }).execute(trx),
    ]);
  });
  console.timeLog("etl", `Finished tagging leaderboards`);
}

async function tagStandard() {
  console.timeLog("etl", `Tagging standard leaderboards`);
  const yearQueries = pastYearsOfStandard().map((year) =>
    getLeaderboardQuery(TagType.STANDARD, {
      path: "Standard",
      board: yearBoard(year),
    }),
  );

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("Tag").where("type", "=", TagType.STANDARD).execute();
    await Promise.all(yearQueries.map((q) => q.execute(trx)));
  });
  console.timeLog("etl", `Finished tagging standard leaderboards`);
}
