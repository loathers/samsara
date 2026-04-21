import { Class, Lifestyle, Path, TagType } from "./db";

import {
  countAscensions,
  getDedication,
  getFrequency,
  getLeaderboard,
  getRecordBreaking,
} from "./db.server";
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
  scDedication: Awaited<ReturnType<typeof getDedication>>;
  scLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  scPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
  scSpecialLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  scSpecialPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
};

type HardcoreLeaderboards = {
  hcDedication: Awaited<ReturnType<typeof getDedication>>;
  hcLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  hcPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
  hcSpecialLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  hcSpecialPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
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
      getDedication(path, lifestyle),
      getLeaderboard({ path, lifestyle, inSeason: path.seasonal }),
      pyrites
        ? getLeaderboard({ path, lifestyle })
        : Promise.resolve([]),
      special
        ? getLeaderboard({ path, lifestyle, special, inSeason: path.seasonal })
        : Promise.resolve([]),
      special && pyrites
        ? getLeaderboard({ path, lifestyle, special: true })
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
    getFrequency({ path, range: calculateRange(path.start ?? new Date(0), new Date()) }),
    getRecordBreaking(path),
    leaderboardsForLifestyle(path, special, "HARDCORE"),
    leaderboardsForLifestyle(path, special, "SOFTCORE"),
    countAscensions(path.name),
    path.end ? countAscensions(path.name, path.end) : Promise.resolve(0),
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
          getLeaderboard({ path, lifestyle: Lifestyle.SOFTCORE, type: TagType.STANDARD, year }),
          getLeaderboard({ path, lifestyle: Lifestyle.HARDCORE, type: TagType.STANDARD, year }),
        ]);
        return [year, { softcore, hardcore }] as const;
      }),
    ),
  );
}
