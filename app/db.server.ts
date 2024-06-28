import { Prisma, PrismaClient } from "@prisma/client";
export const db = new PrismaClient()
  .$extends({
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
          ${path ? Prisma.sql`AND "path" = ${path}` : Prisma.empty}
          GROUP BY DATE_TRUNC('month', "date")
          ORDER BY DATE_TRUNC('month', "date") ASC
        `;
        },
      },
    },
  })
  .$extends({
    result: {
      ascension: {
        pathSlug: {
          needs: { path: true },
          compute(ascension) {
            return ascension.path
              .trim()
              .toLowerCase()
              .replace(/[^a-z]/g, "-")
              .replace(/^-+/g, "")
              .replace(/-+$/g, "");
          },
        },
        id: {
          needs: { playerId: true, ascensionNumber: true },
          compute(ascension) {
            return `${ascension.playerId}/${ascension.ascensionNumber}`;
          },
        },
      },
    },
  });
