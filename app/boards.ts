/**
 * Some paths rank several boards side by side. Two different things can mean that, and
 * they need different mechanisms:
 *
 * - A **cohort** split carves the runs up — Blue vs. Red's teams, or the Sea's pre- and
 *   post-nerf eras. A run belongs to exactly one cohort, so a single tag with a `board`
 *   discriminator covers it. That is what this file describes.
 * - A **ranking** split orders the same runs a second way, as One Crazy Random Summer
 *   does with Fun. A run appears on both boards at once, so it needs two tags — see
 *   SPECIAL_RANKINGS and the _SPECIAL tag types.
 */

import type { TagType } from "./db";

export type Board = {
  /** Stored in Tag.board, and the prefix for this board's accordion hashes. */
  key: string | null;
  /** Heading text, e.g. "Blue Team". Empty for a path that has only one board. */
  label: string;
  /** Restricts the cohort to runs whose `extra` holds this key/value pair. */
  extraEquals?: [key: string, value: string];
  /** Restricts the cohort to runs in this date range, both bounds inclusive. */
  dateRange?: { from?: string; to?: string };
  /** Restricts the cohort to runs of this class. */
  className?: string;
};

/** The paths whose own classes each got their own leaderboard in game. */
const classBoards = (...classNames: string[]): Board[] =>
  classNames.map((className) => ({
    key: className.toLowerCase().replaceAll(" ", "-"),
    label: className,
    className,
  }));

export const PATH_BOARDS = new Map<string, Board[]>([
  [
    // A set of commendations goes to each team, so the teams are never ranked against
    // each other.
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
    // The nerf split the season in two, and the two eras are not comparable. The path has
    // its own route, which titles these sections itself.
    "11,037 Leagues Under the Sea",
    [
      { key: "post-nerf", label: "Post-Nerf", dateRange: { from: "2025-09-01" } },
      { key: "pre-nerf", label: "Pre-Nerf", dateRange: { to: "2025-08-31" } },
    ],
  ],
]);

/** A path with no declared boards ranks as a single unnamed board, as it always has. */
export const DEFAULT_BOARD: Board = { key: null, label: "" };

/**
 * Standard freezes a board per season. These are generated rather than declared, since
 * there is a new one every year.
 */
export const yearBoard = (year: number): Board => ({
  key: String(year),
  label: String(year),
  dateRange: { from: `${year}-01-01`, to: `${year}-12-31` },
});

export const boardsFor = (path: { name: string }) =>
  PATH_BOARDS.get(path.name) ?? [DEFAULT_BOARD];

/** Every path that ranks more than one board, to exclude from whole-database queries. */
export const boardPathNames = () => [...PATH_BOARDS.keys()];

/**
 * Looks a board up from what a tag stores, which is only its key.
 *
 * @returns The board, or undefined for a tag on a path that declares none — including
 *   Standard, whose year boards the tagger generates rather than declaring here
 */
export const findBoard = (pathName: string, key: string | null) =>
  key === null
    ? undefined
    : PATH_BOARDS.get(pathName)?.find((board) => board.key === key);

/**
 * @param key Board key
 * @param suffix Accordion section, e.g. "leaderboards"
 * @returns Hash for the section, unprefixed when the path has only one board
 */
export const boardHash = (key: string | null, suffix: string) =>
  key ? `${key}-${suffix}` : suffix;

/**
 * @param label Board label
 * @param title Section title, e.g. "Leaderboards"
 * @returns Title prefixed with the board's label, where there is one
 */
export const boardTitle = (label: string, title: string) =>
  label ? `${label} ${title}` : title;

/**
 * Where a tag's medal should link to. Shares boardHash with the sections the path page
 * renders, so a medal cannot come to point at a section that does not exist.
 */
export function tagHash(type: TagType, board: string | null) {
  // Standard's boards are years, and each year is its own section.
  if (type === "STANDARD") return board;
  if (type.startsWith("LEADERBOARD")) return boardHash(board, "leaderboards");
  return boardHash(board, "pyrites");
}
