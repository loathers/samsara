import { Ascension, Lifestyle, Player, Prisma } from "@prisma/client";
import { db } from "./db.server";

export async function getLeaderboard(
  path: string,
  lifestyle: Lifestyle,
  orderByExtraKey?: string,
  lastDate?: Date,
) {
  return db.$queryRaw<(Player & Ascension)[]>`
    SELECT * FROM (
      SELECT DISTINCT ON ("playerId") * 
      FROM "Ascension"
      WHERE "pathName" = ${path}
      AND "lifestyle"::text = ${lifestyle}
      AND "dropped" = False
      AND "abandoned" = False
      ${lastDate ? Prisma.sql`AND "date" <= ${lastDate}` : Prisma.empty}
      ORDER BY "playerId", ${orderByExtraKey ? Prisma.sql`("extra"->>${orderByExtraKey})::integer DESC` : Prisma.sql`"days" ASC, "turns" ASC`}, "date" ASC
    ) as "Ascension"
    LEFT JOIN "Player" ON "Ascension"."playerId" = "Player"."id"
    ORDER BY ${orderByExtraKey ? Prisma.sql`("extra"->>${orderByExtraKey})::integer DESC` : Prisma.sql`"days" ASC, "turns" ASC`}, "date" ASC
    LIMIT 35
  `;
}

export function derivePathInfo(firstAscension: Ascension) {
  if (firstAscension.pathName === "None")
    return { name: "None", start: null, end: null };
  const start = new Date(firstAscension.date);
  start.setDate(15);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(14);

  return { name: firstAscension.pathName, start, end };
}
