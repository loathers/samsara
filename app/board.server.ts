import { RawBuilder, sql } from "kysely";

import { Board, boardPathNames, pathExtra } from "./boards";

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

  if (board.familiarAt100) {
    parts.push(
      sql<boolean>`${column("familiarName", alias)} = ${sql.lit(board.familiarAt100)}`,
      sql<boolean>`${column("familiarPercentage", alias)} = 100`,
    );
  }

  return parts;
}

export function boardFilter(board: Board, alias?: string): RawBuilder<boolean> {
  const parts = predicates(board, alias);
  if (parts.length === 0) return sql<boolean>`TRUE`;
  return sql<boolean>`(${sql.join(parts, sql` AND `)})`;
}

const daycountScore = () =>
  sql`-1 * ("days"::bigint * 1000000::bigint + "turns"::bigint)`;

const extraScore = (key: string) => sql`("extra" ->> ${sql.lit(key)})::bigint`;

/** Higher is better whichever the measure, so a record is always a rise. */
export const boardScore = (board: Board) =>
  board.extra ? extraScore(board.extra.key) : daycountScore();

export const boardOrder = (board: Board) => sql`${boardScore(board)} DESC`;

/** For the one pass that has no board: each path scores by its first board's measure. */
export function primaryScore(): RawBuilder<unknown> {
  const branches = boardPathNames().flatMap((pathName) => {
    const extra = pathExtra(pathName);
    return extra
      ? [sql`WHEN ${sql.lit(pathName)} THEN ${extraScore(extra.key)}`]
      : [];
  });

  if (branches.length === 0) return daycountScore();

  return sql`CASE "pathName" ${sql.join(branches, sql` `)} ELSE ${daycountScore()} END`;
}
