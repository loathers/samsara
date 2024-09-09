import {
  Class,
  Lifestyle,
  Path,
  Player,
  Prisma,
  PrismaClient,
  TagType,
} from "@prisma/client";
import { calculateRange } from "./utils";

export const NS13 = "2007-06-25";

declare global {
  var globalPrisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.globalPrisma) {
    global.globalPrisma = new PrismaClient({
      log: [
        {
          emit: "event",
          level: "query",
        },
      ],
    });
  }
  prisma = global.globalPrisma;
}

// prisma.$on("query", async (e) => {
//   console.log(`${e.query} ${e.params}`);
// });

export const db = prisma.$extends({
  model: {
    ascension: {
      async getFrequency({
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
        const data = await db.$queryRaw<{ date: Date; count: number }[]>`
          SELECT 
            DATE_TRUNC('${Prisma.raw(cadence)}', "date") AS "date",
            COUNT(*)::integer AS "count"
          FROM "Ascension"
          WHERE "date" < DATE_TRUNC('${Prisma.raw(cadence)}', NOW())
          AND "date" >= ${start}
          ${path ? Prisma.sql`AND "pathName" = ${path.name}` : Prisma.empty}
          ${player ? Prisma.sql`AND "playerId" = ${player.id}` : Prisma.empty}
          GROUP BY DATE_TRUNC('${Prisma.raw(cadence)}', "date")
          ORDER BY DATE_TRUNC('${Prisma.raw(cadence)}', "date") ASC
        `;
        return data;
      },
      async getPopularity() {
        const results = await db.$queryRaw<
          {
            date: Date;
            name: string;
            slug: string;
            image: string | null;
            lifestyle: Lifestyle;
            count: number;
          }[]
        >`
          SELECT 
            DATE_TRUNC('day', "date") AS "date",
			      "name",
            "slug",
            "image",
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
          path: { name: r.name, slug: r.slug, image: r.image },
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
          where: {
            tags: { some: { type: "RECORD_BREAKING" } },
            pathName: path.name,
            lifestyle,
          },
          orderBy: [{ date: "asc" }],
        });
      },
      async getLeaderboard({
        path,
        lifestyle,
        inSeason,
        special,
      }: {
        path: { name: string; start: Date | null; end: Date | null };
        lifestyle: Lifestyle;
        inSeason?: boolean;
        special?: boolean;
      }) {
        if (inSeason && (!path.start || !path.end)) return [];
        const type = ((inSeason ? "LEADERBOARD" : "PYRITE") +
          (special ? "_SPECIAL" : "")) as TagType;
        const board = await db.ascension.findMany({
          include: {
            player: true,
            class: true,
            tags: true,
          },
          where: {
            path: { name: path.name },
            lifestyle,
            tags: {
              some: {
                type,
              },
            },
          },
        });

        return board.sort(
          (a, b) =>
            (a.tags.find((t) => t.type === type)?.value ?? 35) -
            (b.tags.find((t) => t.type === type)?.value ?? 35),
        );
      },
    },
    player: {
      async getDedication(path: { name: string }, lifestyle: Lifestyle) {
        return await prisma.$queryRaw<(Player & { runs: number })[]>`
          SELECT
            "Player".*,
            COUNT("Player"."id") AS "runs"
          FROM
            "Ascension"
          JOIN
            "Player" ON "Ascension"."playerId" = "Player"."id"
          WHERE
            "Ascension"."pathName" = ${path.name} AND
            "Ascension"."lifestyle" = ${lifestyle}::"Lifestyle" AND
            "Ascension"."abandoned" = false AND
            "Ascension"."dropped" = false AND
            "Ascension"."date" > ${NS13}::date
          GROUP BY
            "Player"."id"
          ORDER BY
            "runs" DESC
          LIMIT 11;
        `;
      },
    },
  },
});

export type DedicationEntry = Awaited<
  ReturnType<typeof db.player.getDedication>
>[number];

export type LeaderboardEntry = Awaited<
  ReturnType<typeof db.ascension.getLeaderboard>
>[number];

export async function getPathData(
  path: Path & { class: Class[] },
  special?: boolean,
) {
  const standard = path.name === "Standard";

  const current =
    (path.start &&
      path.end &&
      new Date() > path.start &&
      new Date() < path.end) ??
    true;
  const hasPyrites = path.seasonal && (!current || standard);

  const bestSC = db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
  });
  const bestSCInSeason = db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    inSeason: true,
  });
  const bestSCSpecial = db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    special: true,
  });
  const bestSCSpecialInSeason = db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    special: true,
    inSeason: true,
  });

  const bestHC = db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
  });
  const bestHCInSeason = db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    inSeason: true,
  });
  const bestHCSpecial = db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    special: true,
  });
  const bestHCSpecialInSeason = db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    special: true,
    inSeason: true,
  });

  return {
    current,
    frequency: await db.ascension.getFrequency({
      path,
      range: calculateRange(path.start ?? new Date(0), new Date()),
    }),
    hcDedication: await db.player.getDedication(path, "HARDCORE"),
    hcLeaderboard: await (hasPyrites ? bestHCInSeason : bestHC),
    hcPyrite: hasPyrites ? await bestHC : [],
    hcSpecialLeaderboard: special
      ? await (hasPyrites ? bestHCSpecialInSeason : bestHCSpecial)
      : [],
    hcSpecialPyrite: special && hasPyrites ? await bestHCSpecial : [],
    path,
    recordBreaking: await db.ascension.getRecordBreaking(path),
    scDedication: await db.player.getDedication(path, "SOFTCORE"),
    scLeaderboard: await (hasPyrites ? bestSCInSeason : bestSC),
    scPyrite: hasPyrites ? await bestSC : [],
    scSpecialLeaderboard: special
      ? await (hasPyrites ? bestSCSpecialInSeason : bestSCSpecial)
      : [],
    scSpecialPyrite: special && hasPyrites ? await bestSCSpecial : [],
  };
}

export async function getKittycoreLeaderboard() {
  return db.$queryRaw<LeaderboardEntry[]>`
    SELECT
      "Ascension".*,
      TO_JSON("Player") as "player",
      TO_JSON("Class") as "class"
    FROM (
      SELECT DISTINCT ON ("playerId")
        * 
      FROM
        "Ascension"
      WHERE
        "pathName" = 'Bad Moon'
        AND "lifestyle" = 'HARDCORE'
        AND "familiar" = 'Black Cat'
        AND "familiarPercentage" = 100
        AND "dropped" = False
        AND "abandoned" = False
      ORDER BY
        "playerId",
        "days" ASC,
        "turns" ASC,
        "date" ASC) as "Ascension"
      LEFT JOIN "Player" ON "Ascension"."playerId" = "Player"."id"
      LEFT JOIN "Class" ON "Ascension"."className" = "Class"."name"
    ORDER BY
      "days" ASC,
      "turns" ASC,
      "date" ASC
    LIMIT 35
  `;
}
