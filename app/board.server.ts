import { RawBuilder, sql } from "kysely";

import { Board, PATH_BOARDS } from "./boards";

/**
 * Compiles the board declarations to SQL. Kept free of any database instance so the
 * tagger, which runs against its own connection, can share it with the app.
 */

const column = (name: string, alias?: string) =>
  sql.ref(alias ? `${alias}.${name}` : name);

/**
 * Board keys and values are ours, not user input, so they go in as literals. The `extra`
 * key especially has to: `jsonb ->> $1` is ambiguous between the text and integer
 * operators, and Postgres will not guess.
 */
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

  return parts;
}

/**
 * @param board Board whose cohort to restrict to
 * @param alias Table alias the Ascension columns are behind, if any
 * @returns A predicate, or TRUE for a path that has only one board
 */
export function boardFilter(board: Board, alias?: string): RawBuilder<boolean> {
  const parts = predicates(board, alias);
  if (parts.length === 0) return sql<boolean>`TRUE`;
  return sql<boolean>`(${sql.join(parts, sql` AND `)})`;
}

/**
 * Which board a run belongs to, for the whole-database queries that cannot fan out into
 * one query per board.
 *
 * @param alias Table alias the Ascension columns are behind, if any
 * @returns An expression yielding the board key, or NULL for a single-board path
 */
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
