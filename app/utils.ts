import { JsonValue } from "@prisma/client/runtime/library";

export type ShortenStyle = null | "acronyms" | "symbols";

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
  const [start, end] = Array.isArray(a)
    ? [a[0].date, a[a.length - 1].date]
    : [a, b!];
  return differenceInDays(end, start);
}

export const formatTurncount = (days: number, turns: number) => {
  return `${numberFormatter.format(days)} / ${numberFormatter.format(turns)}`;
};

export const getExtra = (key: string) => (a: { extra: JsonValue }) => {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return numberFormatter.format(Number(a.extra[key] ?? 0));
};
