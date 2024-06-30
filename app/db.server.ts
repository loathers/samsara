import {
  Ascension,
  Lifestyle,
  Player,
  Prisma,
  PrismaClient,
} from "@prisma/client";
export const db = new PrismaClient().$extends({
  model: {
    ascension: {
      async getStats(start: Date = new Date(2005, 6, 9), path?: string) {
        return await db.$queryRaw<{ date: Date; count: number }[]>`
          SELECT 
            DATE_TRUNC('month', "date") AS "date",
            COUNT(*)::integer AS "count"
          FROM "Ascension"
          WHERE "date" < DATE_TRUNC('month', NOW())
          AND "date" >= ${start}
          ${path ? Prisma.sql`AND "pathName" = ${path}` : Prisma.empty}
          GROUP BY DATE_TRUNC('month', "date")
          ORDER BY DATE_TRUNC('month', "date") ASC
        `;
      },
    },
  },
});
