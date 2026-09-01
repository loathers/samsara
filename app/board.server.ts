import { RawBuilder, sql } from "kysely";

import { Board, PATH_BOARDS } from "./boards";

const column = (name: string, alias?: string) =>
  sql.ref(alias ? `${alias}.${name}` : name);

// Literals, not parameters: `jsonb ->> $1` is ambiguous between the text and integer
// operators, and Postgres will not guess.
function predicates(board: Board, alias?: string) {
  const parts: RawBuilder<boolean>[] = [];

  if (board.extraEquals) {
    const [key, value] = board.extraEquals;
    parts.push(
      sql<boolean>`${column("extra", alias)}->>${sql.lit(key)} = ${sql.lit(value)}`,
    );
  }

  if (board.dateRange?.from) {
    parts.push(
      sql<boolean>`${column("date", alias)} >= ${sql.lit(board.dateRange.from)}::date`,
    );
  }

  if (board.dateRange?.to) {
    parts.push(
      sql<boolean>`${column("date", alias)} <= ${sql.lit(board.dateRange.to)}::date`,
    );
  }

  if (board.className) {
    parts.push(
      sql<boolean>`${column("className", alias)} = ${sql.lit(board.className)}`,
    );
  }

  return parts;
}

export function boardFilter(board: Board, alias?: string): RawBuilder<boolean> {
  const parts = predicates(board, alias);
  if (parts.length === 0) return sql<boolean>`TRUE`;
  return sql<boolean>`(${sql.join(parts, sql` AND `)})`;
}

/** For the whole-database queries that cannot fan out into one query per board. */
export function boardCase(alias?: string): RawBuilder<string | null> {
  const branches = [...PATH_BOARDS].flatMap(([pathName, boards]) =>
    boards.map(
      (board) =>
        sql`WHEN ${column("pathName", alias)} = ${sql.lit(pathName)} AND ${boardFilter(
          board,
          alias,
        )} THEN ${sql.lit(board.key!)}`,
    ),
  );

  if (branches.length === 0) return sql<string | null>`NULL`;

  return sql<string | null>`CASE ${sql.join(branches, sql` `)} END`;
}
