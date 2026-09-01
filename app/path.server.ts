import { Board, DEFAULT_BOARD, boardsFor } from "./boards";
import { Class, Lifestyle, Path, TagType } from "./db";

import {
  ClassComparisonRow,
  countAscensions,
  getClassComparison,
  getDedication,
  getFrequency,
  getLeaderboard,
  getRecentAscensions,
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
  scRecent: Awaited<ReturnType<typeof getRecentAscensions>>;
  scSpecialLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  scSpecialPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
};

type HardcoreLeaderboards = {
  hcDedication: Awaited<ReturnType<typeof getDedication>>;
  hcLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  hcPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
  hcRecent: Awaited<ReturnType<typeof getRecentAscensions>>;
  hcSpecialLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  hcSpecialPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
};

async function leaderboardsForLifestyle(
  path: Path,
  special: boolean,
  lifestyle: "HARDCORE" | "SOFTCORE",
  board: Board = DEFAULT_BOARD,
) {
  const pyrites = hasPyrites(path);
  const prefix = lifestyle === "HARDCORE" ? "hc" : "sc";
  const key = board.key ?? undefined;

  const [
    dedication,
    leaderboard,
    pyrite,
    recent,
    specialLeaderboard,
    specialPyrite,
  ] = await Promise.all([
    getDedication(path, lifestyle, board),
    getLeaderboard({ path, lifestyle, inSeason: path.seasonal, board: key }),
    pyrites
      ? getLeaderboard({ path, lifestyle, board: key })
      : Promise.resolve([]),
    getRecentAscensions({ path, lifestyle, board }),
    special
      ? getLeaderboard({
          path,
          lifestyle,
          special,
          inSeason: path.seasonal,
          board: key,
        })
      : Promise.resolve([]),
    special && pyrites
      ? getLeaderboard({ path, lifestyle, special: true, board: key })
      : Promise.resolve([]),
  ]);

  return {
    [`${prefix}Dedication`]: dedication,
    [`${prefix}Leaderboard`]: leaderboard,
    [`${prefix}Pyrite`]: pyrite,
    [`${prefix}Recent`]: recent,
    [`${prefix}SpecialLeaderboard`]: specialLeaderboard,
    [`${prefix}SpecialPyrite`]: specialPyrite,
  };
}

/** Everything a single board contributes to a path page. */
async function boardData(
  path: Path & { class: Class[] },
  special: boolean,
  board: Board,
) {
  const [recordBreaking, hardcoreLeaderboards, softcoreLeaderboards] =
    await Promise.all([
      getRecordBreaking(path, undefined, board.key ?? undefined),
      leaderboardsForLifestyle(path, special, "HARDCORE", board),
      leaderboardsForLifestyle(path, special, "SOFTCORE", board),
    ]);

  return {
    board,
    recordBreaking,
    ...(hardcoreLeaderboards as HardcoreLeaderboards),
    ...(softcoreLeaderboards as SoftcoreLeaderboards),
  };
}

export type BoardData = Awaited<ReturnType<typeof boardData>>;

export async function getPathData(
  path: Path & { class: Class[] },
  special = false,
) {
  const [frequency, totalRuns, totalRunsInSeason, ...boards] = await Promise.all([
    getFrequency({ path, range: calculateRange(path.start ?? new Date(0), new Date()) }),
    countAscensions(path.name),
    path.end ? countAscensions(path.name, path.end) : Promise.resolve(0),
    ...boardsFor(path).map((board) => boardData(path, special, board)),
  ]);

  return {
    current: inSeason(path),
    frequency,
    path,
    boards,
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
          getLeaderboard({ path, lifestyle: Lifestyle.SOFTCORE, type: TagType.STANDARD, board: String(year) }),
          getLeaderboard({ path, lifestyle: Lifestyle.HARDCORE, type: TagType.STANDARD, board: String(year) }),
        ]);
        return [year, { softcore, hardcore }] as const;
      }),
    ),
  );
}

export type ClassComparisonYear = {
  softcore: ClassComparisonRow[];
  hardcore: ClassComparisonRow[];
};

/**
 * Finished seasons are tagged STANDARD per year; the season in progress only holds
 * LEADERBOARD tags, which carry no year of their own.
 */
export async function getStandardClassComparison(path: Path) {
  const currentYear = new Date().getFullYear();

  const [past, current] = await Promise.all([
    getClassComparison({ path }),
    getClassComparison({ path, tagType: TagType.LEADERBOARD, year: currentYear }),
  ]);

  const byYear = [...past, ...current].reduce<Record<number, ClassComparisonYear>>(
    (acc, row) => {
      const year = (acc[row.year] ??= { softcore: [], hardcore: [] });
      year[row.lifestyle === Lifestyle.SOFTCORE ? "softcore" : "hardcore"].push(row);
      return acc;
    },
    {},
  );

  return { byYear, currentYear };
}
