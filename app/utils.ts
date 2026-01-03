import { JsonValue } from "@prisma/client/runtime/library";

export type ShortenStyle = null | "acronyms" | "symbols" | "full-symbols";

export const yearFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
});

export const monthYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
});

export const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export const compactDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export const numberFormatter = new Intl.NumberFormat(undefined);
export const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatTick = (ts: number, range: number) => {
  const date = new Date(ts);

  if (range >= 600) {
    return yearFormatter.format(date);
  }

  if (range >= 140) {
    return monthYearFormatter.format(date);
  }

  return compactDateFormatter.format(date);
};

export const differenceInDays = (a: Date, b: Date) => {
  return Math.floor(
    Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24),
  );
};

export function calculateRange(list: { date: Date }[]): number;
export function calculateRange(start: Date, end: Date): number;
export function calculateRange(a: Date | { date: Date }[], b?: Date): number {
  if (Array.isArray(a) && a.length === 0) return 0;
  const [start, end] = Array.isArray(a)
    ? [a[0].date, a[a.length - 1].date]
    : [a, b!];
  return differenceInDays(end, start);
}

export const compareDaycount = (
  a?: { days: number; turns: number },
  b?: { days: number; turns: number },
) => {
  const dayComp = (a?.days ?? 0) - (b?.days ?? 0);
  return dayComp !== 0 ? dayComp : (a?.turns ?? 0) - (b?.turns ?? 0);
};

export const hasExtra = (a: {
  extra: JsonValue;
}): a is { extra: Record<string, JsonValue> } =>
  typeof a.extra === "object" &&
  a.extra !== null &&
  !Array.isArray(a.extra) &&
  Object.keys(a.extra).length > 0;

export const getExtra = (key: string) => (a: { extra: JsonValue }) => {
  if (!hasExtra(a)) return 0;
  return Number(a.extra[key] ?? 0);
};

export function awardBg(rank: number, [gold, silver, bronze] = [1, 12, 35]) {
  if (rank <= gold) return "goldmedal";
  if (rank <= silver) return "silvermedal";
  if (rank <= bronze) return "transparent";
  return "transparent";
}

export const NS13 = "2007-06-25T00:00:00Z";
export const STANDARD = 2015;
export const pastYearsOfStandard = () =>
  [...Array(new Date().getFullYear() - STANDARD).keys()].map(
    (y) => y + STANDARD,
  );

/**
 * These paths have a special score for which a leaderboard should be generated. This score exists as metadata in the "extra" field.
 */
export const SPECIAL_RANKINGS = new Map<string, string | undefined>([
  ["Grey Goo", "Goo Score"],
  ["One Crazy Random Summer", "Fun"],
  ["11,037 Leagues Under the Sea", undefined],
]);

export const getDifferenceInMonths = (start: Date, end = new Date()) =>
  Math.max(
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth(),
    0,
  );

/**
 *
 * @param array Array to search
 * @param index Starting index
 * @param predicate Matching predicate
 * @returns First element of the `array` to pass the `predicate` counting backwards from the `index`
 */
export function backwardsSearchFrom<T>(
  array: T[],
  index: number,
  predicate: (value: T, index: number) => boolean,
) {
  for (let i = index; i >= 0; i--) {
    if (predicate(array[i], i)) return array[i];
  }
  return undefined;
}

/**
 * @param word Word to check
 * @returns Whether word is titlecase (i.e. first character is uppercase)
 */
export const isTitleCase = (word: string) => word[0] === word[0].toUpperCase();

/**
 * @param name Full path name
 * @returns Acronym for the provided path according to an attempt at a pattern of logic
 */
export function getPathAcronym(name: string) {
  // First consider some special cases for community favourites or otherwise non-standard shortenings
  switch (name) {
    case "Actually Ed the Undying":
      return "Ed";
    case "A Shrunken Adventurer am I":
      return "Smol";
    case "Standard":
      return "Std";
    case "Class Act II":
      return "CA2";
    case "Wildfire":
      return "WF";
    case "11,037 Leagues Under the Sea":
      return "Sea";
  }

  const parts = name.replace("-", " ").split(" ");

  // If it's one word long, grab all the capital letters
  if (parts.length === 1) {
    const caps = [...name].filter((c) => c === c.toUpperCase());
    if (caps.length > 1) return caps.join("");
  }

  // If we have a sequence of two lowercase words followed by a titlecase word, use the first four letters of the latter word
  if (parts.length >= 4) {
    let lower = 0;
    for (const part of parts) {
      if (!isTitleCase(part)) {
        lower += 1;
        continue;
      }

      if (lower < 2) {
        lower = 0;
        continue;
      }

      return part.substring(0, 4);
    }
  }

  // Otherwise just use the first letter of each word
  const acronym = parts
    .map((word) => (parseInt(word) ? word : word[0]))
    .join("");

  return acronym.length === 1 ? name.slice(0, 3) : acronym;
}

/**
 * @param path Path to format
 * @returns Formatted name
 */
export function formatPathName(path?: { name: string }) {
  if (!path) return "Unknown";
  if (path.name === "None") return "No Path";
  return path.name;
}
