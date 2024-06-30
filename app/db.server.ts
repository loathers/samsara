import { Lifestyle, Prisma, PrismaClient } from "@prisma/client";
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
    },
  },
});
