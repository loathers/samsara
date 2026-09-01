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

import { boardFilter, boardOrder, boardScore, primaryScore } from "./board.server";
import { Board, DEFAULT_BOARD, OVERALL_BOARD, allBoards, boardsFor } from "./boards";

const db = new Kysely<Record<string, never>>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (d) => new PostgresIntrospector(d),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

const compile = (fragment: RawBuilder<unknown>) => fragment.compile(db);

const BLUE = boardsFor({ name: "Blue vs. Red" }).find((b) => b.key === "blue")!;

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

  it("does not restrict a whole-path board, which ranks every cohort at once", () => {
    expect(compile(boardFilter(OVERALL_BOARD)).sql).toBe("TRUE");
  });

  it("matches a familiar only at 100%", () => {
    const kittycore = boardsFor({ name: "Bad Moon" }).find(
      (b) => b.key === "kittycore",
    )!;
    expect(compile(boardFilter(kittycore)).sql).toBe(
      `("familiarName" = 'Black Cat' AND "familiarPercentage" = 100)`,
    );
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

describe("scoring", () => {
  const GOO = boardsFor({ name: "Grey Goo" })[0];

  it("scores a plain board so that fewer days and turns rank higher", () => {
    expect(compile(boardScore(DEFAULT_BOARD)).sql).toBe(
      `-1 * ("days"::bigint * 1000000::bigint + "turns"::bigint)`,
    );
  });

  it("scores a measure board on its own key", () => {
    expect(compile(boardScore(GOO)).sql).toBe(
      `("extra" ->> 'Goo Score')::bigint`,
    );
  });

  it("orders a measure board by that key, best first", () => {
    expect(compile(boardOrder(GOO)).sql).toBe(
      `(("extra" ->> 'Goo Score')::bigint) DESC`,
    );
    expect(compile(boardOrder(DEFAULT_BOARD)).sql).toBe(
      `"days" ASC, "turns" ASC`,
    );
  });

  it("gives the boardless pass a branch per path that ranks on a measure", () => {
    const { sql: text } = compile(primaryScore());

    for (const [pathName, [board]] of allBoards()) {
      if (!board.extra) continue;
      expect(text).toContain(
        `WHEN '${pathName.replaceAll("'", "''")}' THEN ${compile(boardScore(board)).sql}`,
      );
    }

    expect(text).toMatch(/^CASE "pathName" .* ELSE .* END$/);
  });

  it("has no branch for a path whose official board ranks on speed", () => {
    expect(compile(primaryScore()).sql).not.toContain("Blue vs. Red");
  });
});
