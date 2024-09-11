import {
  type Lifestyle,
  type Ascension as AscensionModel,
  type Player,
} from "@prisma/client";
import { Client } from "kol.js";

export interface Ascension extends AscensionModel {
  extra: Record<string, number>;
}

function trim(s: string) {
  return s.replace(/(?:&nbsp;)+$/g, "").trim();
}

function parseDate(d: string) {
  const [month, day, year] = d.split("/");
  return new Date(`20${year}-${month}-${day}`);
}

const textContent = (s: string) => s.match(/<span.*?>(.*?)<\/span>/)?.[1] ?? s;

const extractTitle = (s: string) => s?.match(/title="(.*?)"/s)?.[1];

const parseLifestyle = (restrictions: string): Lifestyle => {
  if (restrictions.includes("beanbag.gif")) return "CASUAL";
  if (restrictions.includes("hardcorex.gif")) return "HARDCORE";
  return "SOFTCORE";
};

const parseExtra = (extra: string) => {
  if (extra === "") return {};
  return Object.fromEntries(
    extra.split(", ").map((pair) => {
      const [value, ...key] = pair.includes(": ")
        ? pair.split(": ").reverse()
        : pair.split(" ");
      return [key.join(" "), Number(value.replace(/,/g, ""))];
    }),
  );
};

const parsePath = (path: string) => {
  const parts = path.match(/(.*?) \((.*?)\)/) ||
    path.match(/(.*?)\s*\n\s*(.*)/s) || [null, path, ""];
  return [parts[1], parseExtra(parts[2])] as const;
};

const parseSign = (sign: string) => {
  return !sign || sign === "(none)" ? "None" : sign;
};

const parseInteger = (num: string) => parseInt(num.replace(/,/g, ""));

const parseIndex = (index: string): [number, boolean] => {
  // The ascension index can have multiple asterisks
  // 1. Dropped path
  // 2. Replaced familiar with a Crimbo Shrub in Picky
  // 3. ? Perhaps one day
  // but we treat them all as a dropped path here.
  const match = index.match(/(\d+)(\*?)/);
  if (!match) return [0, false];
  const ascensionNumber = parseInt(match[1]);
  const dropped = match[2].length > 0;
  return [ascensionNumber, dropped];
};

function parseAscensionRow(playerId: number, row: string): Ascension {
  const cells = [...row.matchAll(/<td.*?>(.*?)<\/td>/gs)].map((cell) =>
    trim(cell[1]),
  );

  const [ascensionNumber, dropped] = parseIndex(cells[0]);

  const base = {
    ascensionNumber,
    playerId,
    date: parseDate(cells[1]),
    dropped,
  };

  if (cells.length === 3) {
    return {
      ...base,
      abandoned: true,
      level: 0,
      className: "None",
      sign: "None",
      turns: 0,
      days: 0,
      familiar: "None",
      familiarPercentage: 0,
      lifestyle: "SOFTCORE",
      pathName: "None",
      extra: {},
    };
  }

  const familiar = (extractTitle(cells[7]) ?? "").match(/^(.*?) \(([\d.]+)%\)/);
  const restrictions = cells[8].split("<img");
  const path = parsePath(extractTitle(restrictions[2]) ?? "None");

  return {
    ...base,
    abandoned: false,
    level: parseInteger(textContent(cells[2])),
    className: extractTitle(cells[3]) ?? "None",
    sign: parseSign(cells[4]),
    turns: parseInteger(textContent(cells[5])),
    days: parseInteger(textContent(cells[6])),
    familiar: familiar?.[1] ?? "None",
    familiarPercentage: parseFloat(familiar?.[2] ?? "0"),
    lifestyle: parseLifestyle(restrictions[1]),
    pathName: path[0],
    extra: path[1],
  };
}

export function parseAscensions(page: string, playerId: number): Ascension[] {
  const rows = page.matchAll(
    /<\/tr>(?:<td.*?>.*?<\/td>){2}(?:<td colspan.*?>.*?<\/td>|(?:<td.*?>.*?<\/td>){7})/gs,
  );
  return [...rows].map((row) => parseAscensionRow(playerId, row[0]));
}

export function parsePlayer(page: string): Player | null {
  const match = page.match(
    /\(<a href="showplayer.php\?who=(\d+)".*?><font.*?>(.*?)<\/font><\/a>\)/,
  );
  if (!match || match[1] === "0") return null;
  return { id: parseInt(match[1]), name: match[2] };
}

export function parseRecentAscenders(page: string): Player[] {
  const rows = page.matchAll(
    /<td>\w{3}(?:&nbsp;)?\d+&nbsp;<\/td><td>.*?who=(\d+).*?<b>(.*?)<\/b>/gs,
  );

  // All this to deduplicate players
  const players = new Map<number, string>();

  for (const row of rows) {
    players.set(parseInt(row[1]), row[2]);
  }

  return [...players].map(([id, name]) => ({ id, name }));
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rolloverSafeFetch(client: Client, url: string) {
  let response = await client.fetchText(url);

  while (client.isRollover()) {
    await wait(60000);
    response = await client.fetchText(url);
  }

  return response;
}

export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
