/**
 * A board is one ranking of a path's runs, tagged by its own query. Boards may overlap or
 * leave runs out, so a run holds one tag per board it places on. Which runs a board takes
 * and how it scores them both live here, and everything else reads them from here.
 */

import type { TagType } from "./db";
import { STANDARD } from "./utils";

export type Board = {
  /** Stored in Tag.board. Null where the path ranks a single board. */
  key: string | null;
  label: string;
  extraEquals?: [key: string, value: string];
  /** Both bounds inclusive. */
  dateRange?: { from?: string; to?: string };
  className?: string;
  familiarAt100?: string;
  /** Ranks on this entry of `extra`, highest first, rather than on days and turns. */
  extra?: { key: string; label: string };
  /** Its dateRange is the season, so the path's start and end do not also apply. */
  ownSeason?: boolean;
  trackRecords?: boolean;
  trackLeaderboard?: boolean;
  /** Off where a board cannot gain runs, so its pyrite would repeat its leaderboard. */
  trackPyrites?: boolean;
};

/** For paths whose classes each got their own leaderboard in game. */
const classBoards = (...classNames: string[]): Board[] =>
  classNames.map((className) => ({
    key: className.toLowerCase().replaceAll(" ", "-"),
    label: className,
    className,
  }));

/** Declare last: unofficial, and it matches every run the cohorts do. */
export const OVERALL_BOARD: Board = { key: "overall", label: "Overall" };

/**
 * Bounded by its own season rather than the path's, which describes only the year in
 * progress, and unable to gain a run once the year is out.
 */
export const yearBoard = (year: number): Board => ({
  key: String(year),
  label: String(year),
  dateRange: { from: `${year}-01-01`, to: `${year}-12-31` },
  ownSeason: true,
  trackRecords: false,
  trackPyrites: false,
});

/** Newest first, and generated on the call so a new year needs no redeploy. */
const standardBoards = (): Board[] => [
  ...Array.from({ length: new Date().getFullYear() - STANDARD + 1 }, (_, i) =>
    yearBoard(STANDARD + i),
  ).reverse(),
  // Every season at once, the one Standard ranking that is not a season.
  { ...OVERALL_BOARD, trackLeaderboard: false },
];

const PATH_BOARDS = new Map<string, Board[] | (() => Board[])>([
  [
    // A set of commendations goes to each team.
    "Blue vs. Red",
    [
      { key: "blue", label: "Blue Team", extraEquals: ["Team", "Blue"] },
      { key: "red", label: "Red Team", extraEquals: ["Team", "Red"] },
      OVERALL_BOARD,
    ],
  ],
  [
    "Avatar of West of Loathing",
    [
      ...classBoards("Cow Puncher", "Beanslinger", "Snake Oiler"),
      OVERALL_BOARD,
    ],
  ],
  [
    "Avatar of Shadows Over Loathing",
    [
      ...classBoards("Pig Skinner", "Cheese Wizard", "Jazz Agent"),
      OVERALL_BOARD,
    ],
  ],
  [
    "Bad Moon",
    [
      { key: "kittycore", label: "Kittycore", familiarAt100: "Black Cat" },
      OVERALL_BOARD,
    ],
  ],
  [
    // The season was ranked on goo alone, so days and turns rank nothing here.
    "Grey Goo",
    [{ key: "goo", label: "", extra: { key: "Goo Score", label: "Goo" } }],
  ],
  [
    // Ranked on fun in season, but the daycount race carried on regardless.
    "One Crazy Random Summer",
    [
      { key: "fun", label: "Fun", extra: { key: "Fun", label: "Fun" } },
      { key: "time", label: "Days/Turns" },
    ],
  ],
  ["Standard", standardBoards],
  [
    // The eras are not comparable. The path's own route titles these sections.
    "11,037 Leagues Under the Sea",
    [
      { key: "post-nerf", label: "Post-Nerf", dateRange: { from: "2025-09-01" } },
      {
        key: "pre-nerf",
        label: "Pre-Nerf",
        dateRange: { to: "2025-08-31" },
        trackPyrites: false,
      },
    ],
  ],
]);

export const DEFAULT_BOARD: Board = { key: null, label: "" };

export function boardsFor(path: { name: string }) {
  const boards = PATH_BOARDS.get(path.name);
  if (!boards) return [DEFAULT_BOARD];
  return typeof boards === "function" ? boards() : boards;
}

export const boardPathNames = () => [...PATH_BOARDS.keys()];

export const allBoards = (): [string, Board[]][] =>
  boardPathNames().map((name) => [name, boardsFor({ name })]);

/** The measure a path's official leaderboard used, which is its first board's. */
export const pathExtra = (pathName: string) =>
  boardsFor({ name: pathName })[0].extra;

export const findBoard = (pathName: string, key: string | null) =>
  key === null
    ? undefined
    : boardsFor({ name: pathName }).find((board) => board.key === key);

/** Section first, so everything before the dot names the section, however deeply nested. */
export const boardHash = (key: string | null, suffix: string) =>
  key ? `${suffix}.${key}` : suffix;

export const hashSection = (hash: string) => hash.split(".")[0];

export const boardTitle = (label: string, title: string) =>
  label ? `${label} ${title}` : title;

/** Routes laying out their own sections; without an entry a medal links to nothing. */
const PATH_TAG_HASH = new Map<
  string,
  (type: TagType, board: string | null) => string | null
>([
  [
    "Bad Moon",
    (_, board) =>
      board === "kittycore" ? "kittycore.leaderboard" : "leaderboard",
  ],
]);

/** Shares boardHash with the page, so a medal cannot link to a section that is not there. */
export function tagHash(pathName: string, type: TagType, board: string | null) {
  const override = PATH_TAG_HASH.get(pathName);
  if (override) return override(type, board);
  if (type.startsWith("LEADERBOARD")) return boardHash(board, "leaderboards");
  return boardHash(board, "pyrites");
}
