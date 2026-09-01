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
import { NS13, calculateRange, pastYearsOfStandard } from "./utils";

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

function byLifestyle(rows: ClassComparisonRow[]): ClassComparisonYear {
  return rows.reduce<ClassComparisonYear>(
    (acc, row) => {
      acc[row.lifestyle === Lifestyle.SOFTCORE ? "softcore" : "hardcore"].push(row);
      return acc;
    },
    { softcore: [], hardcore: [] },
  );
}

/**
 * Grey Goo is ranked by Goo Score and carries no days/turns tags at all, so there is no
 * board here to describe.
 */
const NO_CLASS_COMPARISON = ["Grey Goo"];

/**
 * Mirrors leaderboardsForLifestyle: the headline board is tagged LEADERBOARD while a path is
 * seasonal and PYRITE otherwise, so the comparison has to follow the same window.
 *
 * Paths with their own classes are excluded because those run a board per class in game, so
 * a combined comparison would not describe any board anyone sees.
 */
export async function getPathClassComparison(
  path: Path & { class: Class[] },
  board: Board = DEFAULT_BOARD,
) {
  if (path.class.length > 0 || NO_CLASS_COMPARISON.includes(path.name)) {
    return { main: byLifestyle([]), pyrite: byLifestyle([]) };
  }

  const allTime = { start: NS13, end: new Date() };

  const [main, pyrite] = await Promise.all([
    // Path.end is the last day of the season, and the window's end is exclusive.
    path.seasonal && path.start && path.end
      ? getClassComparison({
          path,
          board,
          tagType: TagType.LEADERBOARD,
          window: { start: path.start, end: new Date(path.end.getTime() + DAY) },
        })
      : getClassComparison({
          path,
          board,
          tagType: TagType.PYRITE,
          window: allTime,
        }),
    hasPyrites(path)
      ? getClassComparison({
          path,
          board,
          tagType: TagType.PYRITE,
          window: allTime,
        })
      : Promise.resolve([]),
  ]);

  return { main: byLifestyle(main), pyrite: byLifestyle(pyrite) };
}

/** Everything a single board contributes to a path page. */
async function boardData(
  path: Path & { class: Class[] },
  special: boolean,
  board: Board,
) {
  const [recordBreaking, hardcoreLeaderboards, softcoreLeaderboards, classes] =
    await Promise.all([
      getRecordBreaking(path, undefined, board.key ?? undefined),
      leaderboardsForLifestyle(path, special, "HARDCORE", board),
      leaderboardsForLifestyle(path, special, "SOFTCORE", board),
      getPathClassComparison(path, board),
    ]);

  return {
    board,
    recordBreaking,
    classes,
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

const DAY = 24 * 60 * 60 * 1000;

export type ClassComparisonYear = {
  softcore: ClassComparisonRow[];
  hardcore: ClassComparisonRow[];
};

/**
 * Finished seasons are tagged STANDARD per year; the season in progress only holds
 * LEADERBOARD tags, which carry no year of their own.
 */
export async function getStandardClassComparison(path: Path) {
  const past = await getClassComparison({ path });

  const byRow = past.reduce<Record<number, ClassComparisonRow[]>>((acc, row) => {
    if (row.year !== null) (acc[row.year] ??= []).push(row);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(byRow).map(([year, rows]) => [year, byLifestyle(rows)]),
  ) as Record<number, ClassComparisonYear>;
}
