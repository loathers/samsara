import type { ColumnType, Selectable } from "kysely";

export const Lifestyle = {
  CASUAL: "CASUAL",
  SOFTCORE: "SOFTCORE",
  HARDCORE: "HARDCORE",
} as const;
export type Lifestyle = (typeof Lifestyle)[keyof typeof Lifestyle];

export const TagType = {
  RECORD_BREAKING: "RECORD_BREAKING",
  PERSONAL_BEST: "PERSONAL_BEST",
  LEADERBOARD: "LEADERBOARD",
  PYRITE: "PYRITE",
  LEADERBOARD_SPECIAL: "LEADERBOARD_SPECIAL",
  PYRITE_SPECIAL: "PYRITE_SPECIAL",
  STANDARD: "STANDARD",
} as const;
export type TagType = (typeof TagType)[keyof typeof TagType];

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface SettingTable {
  key: string;
  value: string;
}

export interface PlayerTable {
  id: number;
  name: string;
}

export interface PathTable {
  name: string;
  slug: string;
  start: Date | null;
  end: Date | null;
  id: number | null;
  image: string | null;
  seasonal: ColumnType<boolean, boolean | undefined, boolean>;
}

export interface ClassTable {
  name: string;
  id: number | null;
  image: string | null;
  pathId: number | null;
}

export interface FamiliarTable {
  name: string;
  image: string;
}

export interface AscensionTable {
  ascensionNumber: number;
  playerId: number;
  date: Date;
  dropped: boolean;
  abandoned: boolean;
  level: number;
  className: string;
  sign: string;
  turns: number;
  days: number;
  familiarName: string | null;
  familiarPercentage: number;
  lifestyle: Lifestyle;
  pathName: string;
  extra: JsonValue;
}

export interface TagTable {
  type: TagType;
  value: number | null;
  year: number | null;
  ascensionNumber: number;
  playerId: number;
}

export interface Database {
  Setting: SettingTable;
  Player: PlayerTable;
  Path: PathTable;
  Class: ClassTable;
  Familiar: FamiliarTable;
  Ascension: AscensionTable;
  Tag: TagTable;
}

export type Setting = Selectable<SettingTable>;
export type Player = Selectable<PlayerTable>;
export type Path = Selectable<PathTable>;
export type Class = Selectable<ClassTable>;
export type Familiar = Selectable<FamiliarTable>;
export type Ascension = Selectable<AscensionTable>;
export type Tag = Selectable<TagTable>;
