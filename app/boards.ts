/**
 * Cohorts: a run belongs to exactly one, so one tag with a board key covers it. Ordering
 * the same runs a second way is not this — a run is on both boards at once, which needs
 * two tags. See SPECIAL_RANKINGS.
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
};

/** For paths whose classes each got their own leaderboard in game. */
const classBoards = (...classNames: string[]): Board[] =>
  classNames.map((className) => ({
    key: className.toLowerCase().replaceAll(" ", "-"),
    label: className,
    className,
  }));

export const PATH_BOARDS = new Map<string, Board[]>([
  [
    // A set of commendations goes to each team.
    "Blue vs. Red",
    [
      { key: "blue", label: "Blue Team", extraEquals: ["Team", "Blue"] },
      { key: "red", label: "Red Team", extraEquals: ["Team", "Red"] },
    ],
  ],
  [
    "Avatar of West of Loathing",
    classBoards("Cow Puncher", "Beanslinger", "Snake Oiler"),
  ],
  [
    "Avatar of Shadows Over Loathing",
    classBoards("Pig Skinner", "Cheese Wizard", "Jazz Agent"),
  ],
  [
    // The eras are not comparable. The path's own route titles these sections.
    "11,037 Leagues Under the Sea",
    [
      { key: "post-nerf", label: "Post-Nerf", dateRange: { from: "2025-09-01" } },
      { key: "pre-nerf", label: "Pre-Nerf", dateRange: { to: "2025-08-31" } },
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

/** Shares boardHash with the page, so a medal cannot link to a section that is not there. */
export function tagHash(type: TagType, board: string | null) {
  // Each Standard year is its own section.
  if (type === "STANDARD") return board;
  if (type.startsWith("LEADERBOARD")) return boardHash(board, "leaderboards");
  return boardHash(board, "pyrites");
}
