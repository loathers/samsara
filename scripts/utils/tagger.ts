import { Prisma, TagType } from "@prisma/client";
import { db, NS13 } from "~/db.server";

const SPECIAL_RANKINGS: [path: string, extra: string][] = [
  ["Grey Goo", "Goo Score"],
  ["One Crazy Random Summer", "Fun"],
];

export async function tagAscensions() {
  await tagRecordBreaking();
  await tagPersonalBest();
}

function getRecordBreakingByExtraQuery(pathName: string, extra: string) {
  return Prisma.sql`
    WITH "filtered_ascensions" AS (
      SELECT
          "ascensionNumber",
          "playerId",
          "date",
          "pathName",
          "lifestyle",
          ("extra" ->> ${extra})::integer AS "score"
          FROM
              "Ascension"
          WHERE
              "dropped" = FALSE
              AND "abandoned" = FALSE
              AND "date" >= ${NS13}::date
              AND "pathName" = ${pathName}),
          "preceding_score" AS (
              SELECT
                  "ascensionNumber",
                  "playerId",
                  "date",
                  "score",
                  "pathName",
                  "lifestyle",
                  max("score") OVER (PARTITION BY "pathName",
                      "lifestyle" ORDER BY "date" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS "preceding_max_score"
          FROM
              "filtered_ascensions"),
          "ranked_records" AS (
              SELECT
                  "ascensionNumber",
                  "playerId",
                  "date",
                  "score",
                  "pathName",
                  "lifestyle",
                  "preceding_max_score",
                  ROW_NUMBER() OVER (PARTITION BY "pathName",
                      "lifestyle",
                      "date" ORDER BY "score") AS "rank_for_date"
          FROM
              "preceding_score"
          WHERE
              "preceding_max_score" IS NULL
              OR "score" > "preceding_max_score")
          INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId")
          SELECT
            ${TagType.RECORD_BREAKING}::"TagType" AS "type",
            NULL AS "value",
            "ascensionNumber",
            "playerId"
          FROM
            "ranked_records"
          WHERE
            "rank_for_date" = 1;
  `;
}

async function tagRecordBreaking() {
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`DELETE FROM "Tag" WHERE "type" = ${TagType.RECORD_BREAKING}::"TagType";`;

      for (const [path, extra] of SPECIAL_RANKINGS) {
        await tx.$executeRaw(getRecordBreakingByExtraQuery(path, extra));
      }

      await tx.$executeRaw`
      WITH "filtered_ascensions" AS (
        SELECT
          "ascensionNumber",
          "playerId",
          "date",
          "days",
          "turns",
          "pathName",
          "lifestyle"
        FROM
          "Ascension"
        WHERE
          "dropped" = FALSE
          AND "abandoned" = FALSE
          AND "date" >= ${NS13}::date
          AND "pathName" NOT IN (${Prisma.join(SPECIAL_RANKINGS.map(([p]) => p))})),
      "preceding_days" AS (
        SELECT
          "ascensionNumber",
          "playerId",
          "date",
          "days",
          "turns",
          "pathName",
          "lifestyle",
          min("days") OVER (PARTITION BY "pathName", "lifestyle" ORDER BY "date" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS "preceding_min_days"
        FROM
          "filtered_ascensions"),
      "preceding_turns" AS (
        SELECT
          "ascensionNumber",
          "playerId",
          "date",
          "days",
          "turns",
          "pathName",
          "lifestyle",
          "preceding_min_days",
          min("turns") OVER (PARTITION BY "pathName", "lifestyle" ORDER BY "date" ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS "preceding_min_turns"
        FROM
          "preceding_days"
        WHERE
          "days" <= "preceding_min_days"),
      "ranked_records" AS (
        SELECT
          "ascensionNumber",
          "playerId",
          "date",
          "days",
          "turns",
          "pathName",
          "lifestyle",
          "preceding_min_days",
          "preceding_min_turns",
          ROW_NUMBER() OVER (PARTITION BY "pathName", "lifestyle", "date" ORDER BY "days", "turns") AS "rank_for_date"
        FROM
          "preceding_turns"
        WHERE
          "preceding_min_days" IS NULL
          OR ("days" < "preceding_min_days")
          OR ("days" = "preceding_min_days"
            AND "turns" < "preceding_min_turns"))
      INSERT INTO "Tag" ("type", "value", "ascensionNumber", "playerId")
      SELECT
        ${TagType.RECORD_BREAKING}::"TagType" AS "type",
        NULL AS "value",
        "ascensionNumber",
        "playerId"
      FROM
        "ranked_records"
      WHERE
        "rank_for_date" = 1;
    `;
    },
    {
      maxWait: 10000,
      timeout: 10000,
    },
  );
}

function getPersonalBestByExtraQuery(pathName: string, extra: string) {
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
          ORDER BY ("extra"->>${extra})::integer DESC
        ) AS "rank"
      FROM
        "Ascension"
      WHERE
        "dropped" = FALSE
        AND "abandoned" = FALSE
        AND "pathName" = ${pathName})
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
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`
      DELETE FROM "Tag" WHERE "type" = ${TagType.PERSONAL_BEST}::"TagType";
    `;

      for (const [path, extra] of SPECIAL_RANKINGS) {
        await tx.$executeRaw(getPersonalBestByExtraQuery(path, extra));
      }

      await tx.$executeRaw`
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
            ORDER BY "days" ASC, "turns" ASC
          ) AS "rank"
        FROM
          "Ascension"
        WHERE
          "dropped" = FALSE
          AND "abandoned" = FALSE
          AND "pathName" NOT IN (${Prisma.join(SPECIAL_RANKINGS.map(([p]) => p))}))
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
    },
    {
      maxWait: 10000,
      timeout: 10000,
    },
  );
}
