import { Class, Lifestyle, Path, TagType } from "@prisma/client";

import { db } from "./db.server";
import { calculateRange, pastYearsOfStandard } from "./utils";

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

  const [dedication, leaderboard, pyrite, specialLeaderboard, specialPyrite] =
    await Promise.all([
      db.player.getDedication(path, lifestyle),
      db.ascension.getLeaderboard({
        path,
        lifestyle: lifestyle,
        inSeason: path.seasonal,
      }),
      pyrites
        ? db.ascension.getLeaderboard({
            path,
            lifestyle: lifestyle,
          })
        : Promise.resolve([]),
      special
        ? db.ascension.getLeaderboard({
            path,
            lifestyle: lifestyle,
            special,
            inSeason: path.seasonal,
          })
        : Promise.resolve([]),
      special && pyrites
        ? db.ascension.getLeaderboard({
            path,
            lifestyle: lifestyle,
            special: true,
          })
        : Promise.resolve([]),
    ]);

  return {
    [`${prefix}Dedication`]: dedication,
    [`${prefix}Leaderboard`]: leaderboard,
    [`${prefix}Pyrite`]: pyrite,
    [`${prefix}SpecialLeaderboard`]: specialLeaderboard,
    [`${prefix}SpecialPyrite`]: specialPyrite,
  };
}

export async function getPathData(
  path: Path & { class: Class[] },
  special = false,
) {
  const [
    frequency,
    recordBreaking,
    hardcoreLeaderboards,
    softcoreLeaderboards,
    totalRuns,
    totalRunsInSeason,
  ] = await Promise.all([
    db.ascension.getFrequency({
      path,
      range: calculateRange(path.start ?? new Date(0), new Date()),
    }),
    db.ascension.getRecordBreaking(path),
    leaderboardsForLifestyle(path, special, "HARDCORE"),
    leaderboardsForLifestyle(path, special, "SOFTCORE"),
    db.ascension.count({ where: { pathName: path.name } }),
    path.end
      ? db.ascension.count({
          where: { pathName: path.name, date: { lt: path.end } },
        })
      : Promise.resolve(0),
  ]);

  return {
    current: inSeason(path),
    frequency,
    path,
    recordBreaking,
    ...(hardcoreLeaderboards as HardcoreLeaderboards),
    ...(softcoreLeaderboards as SoftcoreLeaderboards),
    totalRuns,
    totalRunsInSeason,
  };
}

export async function getPastStandardLeaderboards(
  path: Path & { class: Class[] },
) {
  return Object.fromEntries(
    await Promise.all(
      pastYearsOfStandard().map(async (year) => {
        // Run softcore and hardcore queries in parallel for each year
        const [softcore, hardcore] = await Promise.all([
          db.ascension.getLeaderboard({
            path,
            lifestyle: Lifestyle.SOFTCORE,
            type: TagType.STANDARD,
            year,
          }),
          db.ascension.getLeaderboard({
            path,
            lifestyle: Lifestyle.HARDCORE,
            type: TagType.STANDARD,
            year,
          }),
        ]);
        return [year, { softcore, hardcore }] as const;
      }),
    ),
  );
}
