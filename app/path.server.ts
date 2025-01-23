import { Class, Lifestyle, Path, TagType } from "@prisma/client";

import { db, pastYearsOfStandard } from "./db.server";
import { calculateRange } from "./utils";

export function inSeason(path: Path) {
  return (
    (path.start &&
      path.end &&
      new Date() > path.start &&
      new Date() < path.end) ??
    true
  );
}

export function hasPyrites(path: Path) {
  const standard = path.name === "Standard";
  return path.seasonal && (!inSeason(path) || standard);
}

type SoftcoreLeaderboards = {
  scDedication: Awaited<ReturnType<typeof db.player.getDedication>>;
  scLeaderboard: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  scPyrite: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  scSpecialLeaderboard: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  scSpecialPyrite: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
};

type HardcoreLeaderboards = {
  hcDedication: Awaited<ReturnType<typeof db.player.getDedication>>;
  hcLeaderboard: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  hcPyrite: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  hcSpecialLeaderboard: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
  hcSpecialPyrite: Awaited<ReturnType<typeof db.ascension.getLeaderboard>>;
};

async function leaderboardsForLifestyle(
  path: Path,
  special: boolean,
  lifestyle: "HARDCORE" | "SOFTCORE",
) {
  const pyrites = hasPyrites(path);
  const prefix = lifestyle === "HARDCORE" ? "hc" : "sc";
  return {
    [`${prefix}Dedication`]: await db.player.getDedication(path, lifestyle),
    [`${prefix}Leaderboard`]: await db.ascension.getLeaderboard({
      path,
      lifestyle: lifestyle,
      inSeason: pyrites,
    }),
    [`${prefix}Pyrite`]: pyrites
      ? await db.ascension.getLeaderboard({
          path,
          lifestyle: lifestyle,
        })
      : [],
    [`${prefix}SpecialLeaderboard`]: special
      ? await db.ascension.getLeaderboard({
          path,
          lifestyle: lifestyle,
          special,
          inSeason: pyrites,
        })
      : [],
    [`${prefix}SpecialPyrite`]:
      special && pyrites
        ? await db.ascension.getLeaderboard({
            path,
            lifestyle: lifestyle,
            special: true,
          })
        : [],
  };
}

export async function getPathData(
  path: Path & { class: Class[] },
  special = false,
) {
  return {
    current: inSeason(path),
    frequency: await db.ascension.getFrequency({
      path,
      range: calculateRange(path.start ?? new Date(0), new Date()),
    }),
    path,
    recordBreaking: await db.ascension.getRecordBreaking(path),
    ...((await leaderboardsForLifestyle(
      path,
      special,
      "HARDCORE",
    )) as HardcoreLeaderboards),
    ...((await leaderboardsForLifestyle(
      path,
      special,
      "SOFTCORE",
    )) as SoftcoreLeaderboards),
    totalRuns: await db.ascension.count({ where: { pathName: path.name } }),
    totalRunsInSeason: path.end
      ? await db.ascension.count({
          where: { pathName: path.name, date: { lt: path.end } },
        })
      : 0,
  };
}

export async function getPastStandardLeaderboards(
  path: Path & { class: Class[] },
) {
  return Object.fromEntries(
    await Promise.all(
      pastYearsOfStandard().map(
        async (year) =>
          [
            year,
            {
              softcore: await db.ascension.getLeaderboard({
                path,
                lifestyle: Lifestyle.SOFTCORE,
                type: TagType.STANDARD,
                year,
              }),
              hardcore: await db.ascension.getLeaderboard({
                path,
                lifestyle: Lifestyle.HARDCORE,
                type: TagType.STANDARD,
                year,
              }),
            },
          ] as const,
      ),
    ),
  );
}
