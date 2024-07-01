export const formatPathName = (name: string) =>
  name === "None" ? "No Path" : name;

export type PostgresInterval = "month" | "week";
