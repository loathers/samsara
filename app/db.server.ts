import { Lifestyle, Path, Prisma, PrismaClient } from "@prisma/client";
import { PostgresInterval } from "./utils";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

// prisma.$on("query", async (e) => {
//   console.log(`${e.query} ${e.params}`)
// })

export const db = prisma.$extends({
  model: {
    ascension: {
      async getFrequency(
        path?: { name: string },
        start: Date = new Date(2005, 6, 9),
        cadence: PostgresInterval = "month",
      ) {
        const data = await db.$queryRaw<{ date: Date; count: number }[]>`
          SELECT 
            DATE_TRUNC('${Prisma.raw(cadence)}', "date") AS "date",
            COUNT(*)::integer AS "count"
          FROM "Ascension"
          WHERE "date" < DATE_TRUNC('${Prisma.raw(cadence)}', NOW())
          AND "date" >= ${start}
          ${path ? Prisma.sql`AND "pathName" = ${path.name}` : Prisma.empty}
          GROUP BY DATE_TRUNC('${Prisma.raw(cadence)}', "date")
          ORDER BY DATE_TRUNC('${Prisma.raw(cadence)}', "date") ASC
        `;
        return [data, cadence] as [
          data: typeof data,
          cadence: PostgresInterval,
        ];
      },
      async getPopularity() {
        const results = await db.$queryRaw<
          {
            date: Date;
            name: string;
            slug: string;
            lifestyle: Lifestyle;
            count: number;
          }[]
        >`
          SELECT 
            DATE_TRUNC('day', "date") AS "date",
			      "name",
            "slug",
			      "lifestyle",
            COUNT(*)::integer AS "count"
          FROM "Ascension"
          LEFT JOIN "Path" on "Path"."name" = "Ascension"."pathName"
          WHERE "date" < DATE_TRUNC('day', NOW())
          AND "date" >= DATE_TRUNC('day', NOW() - interval '1 week')
          GROUP BY "Path"."name", "lifestyle", DATE_TRUNC('day', "date")
          ORDER BY DATE_TRUNC('day', "date") ASC
        `;

        return results.map((r) => ({
          ...r,
          name: undefined,
          slug: undefined,
          path: { name: r.name, slug: r.slug },
        }));
      },
      async getStat({
        numberOfAscensions,
        path,
      }: {
        numberOfAscensions?: number;
        path?: { name: string };
      }) {
        const [{ stat }] = await db.$queryRaw<[{ stat: number }]>`
          SELECT COUNT(*)::integer AS "stat" FROM (
            SELECT
              "name"
            FROM "Player"
            LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
            WHERE
              ${path ? Prisma.sql`"Ascension"."pathName" = ${path.name} AND` : Prisma.empty}
              "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
              "Ascension"."date" < DATE_TRUNC('day', NOW())
            GROUP BY "Player"."id"
            ${numberOfAscensions === undefined ? Prisma.empty : Prisma.sql`HAVING COUNT("Ascension"."playerId") >= ${numberOfAscensions}`})
        `;

        const [{ previousStat }] = await db.$queryRaw<
          [{ previousStat: number }]
        >`
          SELECT COUNT(*)::integer AS "previousStat" FROM (
            SELECT
              "name"
            FROM "Player"
            LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
            WHERE
              ${path ? Prisma.sql`"Ascension"."pathName" = ${path.name} AND` : Prisma.empty}
              "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
              "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
            GROUP BY "Player"."id"
            ${numberOfAscensions === undefined ? Prisma.empty : Prisma.sql`HAVING COUNT("Ascension"."playerId") >= ${numberOfAscensions}`})
          `;

        return [stat, stat / previousStat - 1] as [
          stat: number,
          change: number,
        ];
      },
      async getRecordBreaking(path: Path, lifestyle?: Lifestyle) {
        return await db.ascension.findMany({
          select: {
            days: true,
            turns: true,
            date: true,
            lifestyle: true,
            extra: true,
            player: { select: { name: true, id: true } },
          },
          where: { recordBreaking: true, path, lifestyle },
          orderBy: [{ date: "asc" }],
        });
      },
    },
  },
});
