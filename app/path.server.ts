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
import { NS13, calculateRange } from "./utils";

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
};

type HardcoreLeaderboards = {
  hcDedication: Awaited<ReturnType<typeof getDedication>>;
  hcLeaderboard: Awaited<ReturnType<typeof getLeaderboard>>;
  hcPyrite: Awaited<ReturnType<typeof getLeaderboard>>;
  hcRecent: Awaited<ReturnType<typeof getRecentAscensions>>;
};

async function leaderboardsForLifestyle(
  path: Path,
  lifestyle: "HARDCORE" | "SOFTCORE",
  board: Board = DEFAULT_BOARD,
) {
  const prefix = lifestyle === "HARDCORE" ? "hc" : "sc";
  const key = board.key ?? undefined;

  const [dedication, leaderboard, pyrite, recent] = await Promise.all([
    getDedication(path, lifestyle, board),
    getLeaderboard({ path, lifestyle, inSeason: path.seasonal, board: key }),
    hasPyrites(path)
      ? getLeaderboard({ path, lifestyle, board: key })
      : Promise.resolve([]),
    getRecentAscensions({ path, lifestyle, board }),
  ]);

  return {
    [`${prefix}Dedication`]: dedication,
    [`${prefix}Leaderboard`]: leaderboard,
    [`${prefix}Pyrite`]: pyrite,
    [`${prefix}Recent`]: recent,
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
 * Mirrors leaderboardsForLifestyle: the headline board is tagged LEADERBOARD while a path is
 * seasonal and PYRITE otherwise, so the comparison has to follow the same window.
 *
 * Paths with their own classes are excluded because those run a board per class in game, so
 * a combined comparison would not describe any board anyone sees. So are boards ranked on
 * something other than speed, which the chart has no way to draw.
 */
export async function getPathClassComparison(
  path: Path & { class: Class[] },
  board: Board = DEFAULT_BOARD,
) {
  if (path.class.length > 0 || board.extra) {
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

async function boardData(path: Path & { class: Class[] }, board: Board) {
  const [recordBreaking, hardcoreLeaderboards, softcoreLeaderboards, classes] =
    await Promise.all([
      getRecordBreaking(path, undefined, board.key ?? undefined),
      leaderboardsForLifestyle(path, "HARDCORE", board),
      leaderboardsForLifestyle(path, "SOFTCORE", board),
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

/** A route with many boards can name the few it renders rather than fetching all of them. */
export async function getPathData(
  path: Path & { class: Class[] },
  only: Board[] = boardsFor(path),
) {
  const [frequency, totalRuns, totalRunsInSeason, ...boards] = await Promise.all([
    getFrequency({ path, range: calculateRange(path.start ?? new Date(0), new Date()) }),
    countAscensions(path.name),
    path.end ? countAscensions(path.name, path.end) : Promise.resolve(0),
    ...only.map((board) => boardData(path, board)),
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

/** Every season Standard has run, the one in progress included. */
export async function getStandardSeasons(path: Path & { class: Class[] }) {
  const seasons = boardsFor(path).filter((board) => board.ownSeason);

  return await Promise.all(
    seasons.map(async (board) => {
      const [softcore, hardcore] = await Promise.all([
        getLeaderboard({
          path,
          lifestyle: Lifestyle.SOFTCORE,
          type: TagType.LEADERBOARD,
          board: board.key!,
        }),
        getLeaderboard({
          path,
          lifestyle: Lifestyle.HARDCORE,
          type: TagType.LEADERBOARD,
          board: board.key!,
        }),
      ]);
      return { board, softcore, hardcore };
    }),
  );
}

const DAY = 24 * 60 * 60 * 1000;

export type ClassComparisonYear = {
  softcore: ClassComparisonRow[];
  hardcore: ClassComparisonRow[];
};

/** Every season's tags carry its year, so one query covers them all. */
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
