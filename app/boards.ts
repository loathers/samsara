/**
 * A board is one ranking of a path's runs, tagged by its own query. Boards may overlap or
 * leave runs out, so a run holds one tag per board it places on. Ranking the same runs by
 * another measure is a tag type rather than a board. See SPECIAL_RANKINGS.
 */

import type { TagType } from "./db";

export type Board = {
  /** Stored in Tag.board. Null where the path ranks a single board. */
  key: string | null;
  label: string;
  extraEquals?: [key: string, value: string];
  /** Both bounds inclusive. */
  dateRange?: { from?: string; to?: string };
  className?: string;
  familiarAt100?: string;
  trackRecords?: boolean;
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

export const PATH_BOARDS = new Map<string, Board[]>([
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

/** Generated rather than declared, since Standard gains a season every year. */
export const yearBoard = (year: number): Board => ({
  key: String(year),
  label: String(year),
  dateRange: { from: `${year}-01-01`, to: `${year}-12-31` },
});

export const boardsFor = (path: { name: string }) =>
  PATH_BOARDS.get(path.name) ?? [DEFAULT_BOARD];

export const boardPathNames = () => [...PATH_BOARDS.keys()];

/** Undefined for a path that declares no boards, including Standard's year boards. */
export const findBoard = (pathName: string, key: string | null) =>
  key === null
    ? undefined
    : PATH_BOARDS.get(pathName)?.find((board) => board.key === key);

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
    "One Crazy Random Summer",
    (type) =>
      `${type.endsWith("_SPECIAL") ? "fun" : "time"}-${
        type.startsWith("LEADERBOARD") ? "leaderboards" : "pyrites"
      }`,
  ],
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
  // Each Standard year is its own section.
  if (type === "STANDARD") return board;
  if (type.startsWith("LEADERBOARD")) return boardHash(board, "leaderboards");
  return boardHash(board, "pyrites");
}
