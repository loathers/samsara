import { Ascension, Lifestyle, Player, Prisma } from "@prisma/client";
import { db } from "./db.server";

export async function getLeaderboard(
  path: { name: string; start: Date | null; end: Date | null },
  lifestyle: Lifestyle,
  inSeason = false,
  orderByExtraKey?: string,
) {
  if (inSeason && (!path.start || !path.end)) return [];
  return db.$queryRaw<(Player & Ascension)[]>`
    SELECT * FROM (
      SELECT DISTINCT ON ("playerId") * 
      FROM "Ascension"
      WHERE "pathName" = ${path.name}
      AND "lifestyle"::text = ${lifestyle}
      AND "dropped" = False
      AND "abandoned" = False
      ${inSeason ? Prisma.sql`AND "date" >= ${path.start} AND "date" <= ${path.end}` : Prisma.empty}
      ORDER BY "playerId", ${orderByExtraKey ? Prisma.sql`("extra"->>${orderByExtraKey})::integer DESC` : Prisma.sql`"days" ASC, "turns" ASC`}, "date" ASC
    ) as "Ascension"
    LEFT JOIN "Player" ON "Ascension"."playerId" = "Player"."id"
    ORDER BY ${orderByExtraKey ? Prisma.sql`("extra"->>${orderByExtraKey})::integer DESC` : Prisma.sql`"days" ASC, "turns" ASC`}, "date" ASC
    LIMIT 35
  `;
}
