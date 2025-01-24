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

export const getExtra = (key: string) => (a: { extra: JsonValue }) => {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return Number(a.extra[key] ?? 0);
};

export function awardBg(rank: number, [gold, silver, bronze] = [1, 12, 35]) {
  if (rank <= gold) return "goldmedal";
  if (rank <= silver) return "silvermedal";
  if (rank <= bronze) return "transparent";
  return "transparent";
}

/**
 * These paths have a special score for which a leaderboard should be generated. This score exists as metadata in the "extra" field.
 */
export const SPECIAL_RANKINGS = new Map<string, string>([
  ["Grey Goo", "Goo Score"],
  ["One Crazy Random Summer", "Fun"],
]);

export const getDifferenceInMonths = (start: Date, end = new Date()) =>
  Math.max(
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth(),
    0,
  );
