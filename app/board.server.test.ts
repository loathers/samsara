import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  RawBuilder,
  sql,
} from "kysely";
import { describe, expect, it } from "vitest";

import { boardCase, boardFilter } from "./board.server";
import { Board, DEFAULT_BOARD, PATH_BOARDS } from "./boards";

const db = new Kysely<Record<string, never>>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (d) => new PostgresIntrospector(d),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

const compile = (fragment: RawBuilder<unknown>) => fragment.compile(db);

const BLUE = PATH_BOARDS.get("Blue vs. Red")![0];

const PRE_NERF: Board = {
  key: "pre-nerf",
  label: "Pre-Nerf",
  dateRange: { from: "2024-01-01", to: "2025-08-31" },
};

describe("boardFilter", () => {
  it("matches a value in extra", () => {
    expect(compile(boardFilter(BLUE)).sql).toBe(
      `("extra"->>'Team' = 'Blue')`,
    );
  });

  it("qualifies columns with a table alias", () => {
    expect(compile(boardFilter(BLUE, "a")).sql).toBe(
      `("a"."extra"->>'Team' = 'Blue')`,
    );
  });

  it("matches an inclusive date range", () => {
    expect(compile(boardFilter(PRE_NERF)).sql).toBe(
      `("date" >= '2024-01-01'::date AND "date" <= '2025-08-31'::date)`,
    );
  });

  it("does not restrict a path that has only one board", () => {
    expect(compile(boardFilter(DEFAULT_BOARD)).sql).toBe("TRUE");
  });

  it("inlines its values rather than binding them", () => {
    expect(compile(boardFilter(BLUE)).parameters).toEqual([]);
  });

  it("parenthesises so it can be ANDed into a larger predicate", () => {
    const { sql: text } = compile(
      sql`SELECT 1 FROM "Ascension" WHERE "dropped" IS FALSE AND ${boardFilter(PRE_NERF)}`,
    );
    expect(text).toBe(
      `SELECT 1 FROM "Ascension" WHERE "dropped" IS FALSE AND ("date" >= '2024-01-01'::date AND "date" <= '2025-08-31'::date)`,
    );
  });
});

describe("boardCase", () => {
  it("gives every declared board a branch keyed on its path and cohort", () => {
    const { sql: text } = compile(boardCase());

    for (const [pathName, boards] of PATH_BOARDS) {
      for (const board of boards) {
        expect(text).toContain(
          `WHEN "pathName" = '${pathName.replaceAll("'", "''")}' AND ` +
            `${compile(boardFilter(board)).sql} THEN '${board.key}'`,
        );
      }
    }

    expect(text).toMatch(/^CASE .* END$/);
  });

  it("has no branch for a path that declares no boards, so it yields NULL there", () => {
    expect(compile(boardCase()).sql).not.toContain("Wildfire");
  });
});
