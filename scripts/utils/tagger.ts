import {
  NS13,
  SPECIAL_RANKINGS,
  pastYearsOfStandard,
} from "../../app/utils.js";
import { Prisma, TagType } from "@prisma/client";

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
  return Prisma.sql`
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
        END AS "score"
      FROM
        "Ascension"
      WHERE
        "dropped" = FALSE
        AND "abandoned" = FALSE
        AND "date" >= ${NS13}::date
        AND (
          ("pathName" = '11,037 Leagues Under the Sea' AND "date" >= '2025-09-01 00:00:00'::date)
          OR ("pathName" <> '11,037 Leagues Under the Sea')
        )
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
        max("score") OVER (PARTITION BY "pathName", "lifestyle" ORDER BY "date" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS "precedingMaxScore"
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
        "precedingMaxScore",
        ROW_NUMBER() OVER (PARTITION BY "pathName", "lifestyle", "date" ORDER BY "score") AS "rankForDate"
      FROM
        "precedingScore"
      WHERE
        "precedingMaxScore" IS NULL
        OR ("score" > "precedingMaxScore")
    )
    INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId")
    SELECT
      ${TagType.RECORD_BREAKING}::"TagType" AS "type",
      NULL AS "value",
      "ascensionNumber",
      "playerId"
    FROM
      "rankedRecords"
    WHERE
      "rankForDate" = 1;
  `;
}

async function tagRecordBreaking() {
  console.timeLog("etl", "Tagging record-breaking ascensions");
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`DELETE FROM "Tag" WHERE "type" = ${TagType.RECORD_BREAKING}::"TagType";`;
      await tx.$executeRaw(getRecordBreakingQuery());
    },
    {
      maxWait: 10_000,
      timeout: 180_000,
    },
  );
  console.timeLog("etl", "Finished tagging record-breaking ascensions");
}

function getPersonalBestQuery() {
  return Prisma.sql`
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
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "Tag" WHERE "type" = ${TagType.PERSONAL_BEST}::"TagType";
      `;
      await tx.$executeRaw(getPersonalBestQuery());
    },
    {
      maxWait: 10_000,
      timeout: 180_000,
    },
  );
  console.timeLog("etl", `Finished tagging personal bests`);
}

function getLeaderboardQuery(
  tagType: TagType,
  {
    path,
    inSeason,
    excludePaths,
    extra,
    special = false,
    limit = 35,
    year,
  }: {
    path?: string;
    excludePaths?: string[];
    inSeason?: boolean;
    extra?: string;
    special?: boolean;
    limit?: number;
    year?: number;
  } = {},
) {
  const order = extra
    ? Prisma.sql`("extra"->>${extra})::integer DESC`
    : Prisma.sql`"days" ASC, "turns" ASC`;

  return Prisma.sql`
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
      ${path ? Prisma.sql`AND "pathName" = ${path}` : Prisma.empty}
      AND (
        ("pathName" = '11,037 Leagues Under the Sea' AND ${special} is TRUE AND "date" <= '2025-08-31 00:00:00'::date)
        OR ("pathName" = '11,037 Leagues Under the Sea' AND ${special} is FALSE AND "date" >= '2025-09-01 00:00:00'::date)
        OR ("pathName" <> '11,037 Leagues Under the Sea')
      )
      ${inSeason ? Prisma.sql`AND "date" >= "Path"."start" AND "date" <= "Path"."end"` : Prisma.empty}
      ${excludePaths ? Prisma.sql`AND "pathName" NOT IN (${Prisma.join(excludePaths)})` : Prisma.empty}
      ${year ? Prisma.sql`AND DATE_PART('year', "date") = ${year}` : Prisma.sql`AND "date" >= ${NS13}::date`}),
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
    INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId"${year ? Prisma.sql`, "year"` : Prisma.empty})
    SELECT
      ${tagType}::"TagType" as "type",
      "rank" as "value",
      "ascensionNumber",
      "playerId"
      ${year ? Prisma.sql`, ${year} as "year"` : Prisma.empty}
    FROM
      "leaderboard"
    ${limit ? Prisma.sql`WHERE "rank" <= ${limit}` : Prisma.empty}
  `;
}

async function getBestRuns() {
  const golds = await db.tag.findMany({
    where: {
      type: TagType.PYRITE,
      value: 1,
    },
    select: {
      ascension: {
        select: {
          ascensionNumber: true,
          player: true,
          days: true,
          turns: true,
          lifestyle: true,
          pathName: true,
        },
      },
    },
  });

  return golds
    .map(({ ascension }) => ascension)
    .reduce(
      (acc, { pathName, lifestyle, ...rest }) => ({
        ...acc,
        [`${pathName}_${lifestyle}`]: { pathName, lifestyle, ...rest },
      }),
      {} as Record<string, (typeof golds)[number]["ascension"]>,
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

  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "Tag" WHERE "type" IN (${TagType.PYRITE}::"TagType", ${TagType.PYRITE_SPECIAL}::"TagType");
      `;

      await Promise.all([
        ...[...SPECIAL_RANKINGS].map(([path, extra]) =>
          tx.$executeRaw(
            getLeaderboardQuery(TagType.PYRITE_SPECIAL, { path, extra }),
          ),
        ),
        tx.$executeRaw(
          getLeaderboardQuery(TagType.PYRITE, {
            excludePaths: NEVER_RANK_BY_TURNCOUNT,
          }),
        ),
      ]);
    },
    {
      maxWait: 10_000,
      timeout: 180_000,
    },
  );
  console.timeLog("etl", `Finished tagging pyrites`);

  if (sendWebhook) {
    if (!process.env.OAF_TOKEN) {
      console.timeLog("etl", "No OAF_TOKEN set, skipping OAF webhook");
    } else {
      console.timeLog("etl", "Reporting new golds to OAF webhook");
      for (const [category, run] of Object.entries(await getBestRuns())) {
        const previous = golds[category];
        if (
          run.ascensionNumber !== previous.ascensionNumber ||
          run.player.id !== previous.player.id
        ) {
          // Record breaker!
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
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "Tag" WHERE "type" IN (${TagType.LEADERBOARD}::"TagType", ${TagType.LEADERBOARD_SPECIAL}::"TagType");
      `;

      await Promise.all([
        ...[...SPECIAL_RANKINGS].map(([path, extra]) =>
          tx.$executeRaw(
            getLeaderboardQuery(TagType.LEADERBOARD_SPECIAL, {
              path,
              inSeason: true,
              extra,
              special: true,
            }),
          ),
        ),
        tx.$executeRaw(
          getLeaderboardQuery(TagType.LEADERBOARD, {
            inSeason: true,
            special: false,
            excludePaths: NEVER_RANK_BY_TURNCOUNT,
          }),
        ),
      ]);
    },
    {
      maxWait: 10_000,
      timeout: 180_000,
    },
  );
  console.timeLog("etl", `Finished tagging leaderboards`);
}

async function tagStandard() {
  console.timeLog("etl", `Tagging standard leaderboards`);

  const years = pastYearsOfStandard().map((year) =>
    db.$executeRaw(
      getLeaderboardQuery(TagType.STANDARD, {
        path: "Standard",
        year,
      }),
    ),
  );

  await db.$transaction([
    db.$executeRaw`DELETE FROM "Tag" WHERE "type" IN (${TagType.STANDARD}::"TagType");`,
    ...years,
  ]);
  console.timeLog("etl", `Finished tagging standard leaderboards`);
}
