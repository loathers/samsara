import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOARD,
  OVERALL_BOARD,
  allBoards,
  boardHash,
  boardTitle,
  boardsFor,
  hashSection,
  findBoard,
  tagHash,
  yearBoard,
} from "./boards";

describe("boardsFor", () => {
  it("gives a path that declares no boards a single unnamed one", () => {
    expect(boardsFor({ name: "Wildfire" })).toEqual([DEFAULT_BOARD]);
  });

  it("gives Blue vs. Red a board per team, over a whole-path board", () => {
    expect(boardsFor({ name: "Blue vs. Red" }).map((b) => b.key)).toEqual([
      "blue",
      "red",
      "overall",
    ]);
  });

  it("puts the whole-path board last, the official cohorts being the draw", () => {
    for (const [, boards] of allBoards()) {
      const overall = boards.findIndex((b) => b.key === OVERALL_BOARD.key);
      if (overall >= 0) expect(overall).toBe(boards.length - 1);
    }
  });

  it("leaves a path that did not opt in without a whole-path board", () => {
    expect(
      boardsFor({ name: "11,037 Leagues Under the Sea" }).map((b) => b.key),
    ).not.toContain(OVERALL_BOARD.key);
  });

  it("lets Bad Moon's boards leave the catless runs to the overall one", () => {
    expect(boardsFor({ name: "Bad Moon" }).map((b) => b.key)).toEqual([
      "kittycore",
      "overall",
    ]);
  });

  it("puts the Sea's true board first, so it takes the unprefixed hashes", () => {
    expect(boardsFor({ name: "11,037 Leagues Under the Sea" })[0].key).toBe(
      "post-nerf",
    );
  });
});

describe("OVERALL_BOARD", () => {
  it("declares no predicates, so it takes every run on the path", () => {
    expect(OVERALL_BOARD).toEqual({ key: "overall", label: "Overall" });
  });

  it("resolves like any other board, so a medal can name it", () => {
    expect(findBoard("Blue vs. Red", "overall")?.label).toBe("Overall");
    expect(tagHash("Blue vs. Red", "PYRITE", "overall", "HARDCORE")).toBe(
      boardHash("overall", "pyrites"),
    );
  });
});

describe("naming", () => {
  it("leaves a single-board path's titles and hashes exactly as they were", () => {
    expect(boardTitle(DEFAULT_BOARD.label, "Leaderboards")).toBe("Leaderboards");
    expect(boardHash(DEFAULT_BOARD.key, "leaderboards")).toBe("leaderboards");
  });

  it("prefixes a named board", () => {
    expect(boardTitle("Blue Team", "Pyrites")).toBe("Blue Team Pyrites");
    expect(boardHash("blue", "pyrites")).toBe("pyrites.blue");
  });

  it("puts the section first, so a nested hash still names its section", () => {
    expect(hashSection(boardHash("cow-puncher", "leaderboards"))).toBe(
      "leaderboards",
    );
    expect(hashSection(boardHash(null, "leaderboards"))).toBe("leaderboards");
    expect(hashSection(boardHash("pre-nerf", "dedication"))).toBe("dedication");
  });
});

describe("findBoard", () => {
  it("resolves a key back to its board", () => {
    expect(findBoard("Blue vs. Red", "red")?.label).toBe("Red Team");
  });

  it("is undefined for an untagged board or an undeclared path", () => {
    expect(findBoard("Blue vs. Red", null)).toBeUndefined();
    expect(findBoard("Wildfire", "blue")).toBeUndefined();
  });

  it("resolves a Standard year, generated rather than declared", () => {
    expect(findBoard("Standard", "2024")).toEqual(yearBoard(2024));
  });
});

describe("tagHash", () => {
  it("matches the section a single-board path renders", () => {
    expect(tagHash("Wildfire", "LEADERBOARD", null, "HARDCORE")).toBe("leaderboards");
    expect(tagHash("Wildfire", "PYRITE", null, "HARDCORE")).toBe("pyrites");
  });

  it("matches the section a named board renders", () => {
    expect(tagHash("Blue vs. Red", "LEADERBOARD", "blue", "HARDCORE")).toBe(
      boardHash("blue", "leaderboards"),
    );
    expect(
      tagHash("11,037 Leagues Under the Sea", "PYRITE", "pre-nerf", "HARDCORE"),
    ).toBe(boardHash("pre-nerf", "pyrites"));
  });

  it("sends a lone measure board to the section that renders it unnested", () => {
    expect(hashSection(tagHash("Grey Goo", "PYRITE", "goo", "HARDCORE")!)).toBe("pyrites");
  });

  it("sends a Standard season to the year under its section", () => {
    expect(tagHash("Standard", "LEADERBOARD", "2024", "HARDCORE")).toBe(
      boardHash("2024", "leaderboards"),
    );
  });

  it("names a measure board like any other", () => {
    expect(tagHash("One Crazy Random Summer", "PYRITE", "fun", "HARDCORE")).toBe(
      boardHash("fun", "pyrites"),
    );
    expect(tagHash("One Crazy Random Summer", "LEADERBOARD", "time", "HARDCORE")).toBe(
      boardHash("time", "leaderboards"),
    );
  });

  it("follows Bad Moon's board-first layout", () => {
    expect(tagHash("Bad Moon", "PYRITE", "kittycore", "HARDCORE")).toBe(
      "kittycore.leaderboard",
    );
    expect(tagHash("Bad Moon", "PYRITE", "overall", "HARDCORE")).toBe("leaderboard");
  });

  it("sends Bad Moon's odder lifestyles to the section that shows them", () => {
    expect(tagHash("Bad Moon", "PYRITE", "overall", "SOFTCORE")).toBe("weird");
    expect(tagHash("Bad Moon", "PYRITE", "overall", "CASUAL")).toBe("weird");
  });

  it("keeps every override pointing at a section its route renders", () => {
    expect(hashSection(tagHash("Bad Moon", "PYRITE", "kittycore", "HARDCORE")!)).toBe(
      "kittycore",
    );
    expect(hashSection(tagHash("Bad Moon", "PYRITE", "overall", "HARDCORE")!)).toBe(
      "leaderboard",
    );
  });
});

describe("yearBoard", () => {
  it("bounds a Standard season to its calendar year", () => {
    expect(yearBoard(2024)).toMatchObject({
      key: "2024",
      label: "2024",
      dateRange: { from: "2024-01-01", to: "2024-12-31" },
      ownSeason: true,
    });
  });
});

describe("Standard", () => {
  const boards = boardsFor({ name: "Standard" });
  const thisYear = new Date().getFullYear();

  it("gains the year in progress without waiting for a redeploy", () => {
    expect(boards[0].key).toBe(String(thisYear));
  });

  it("runs from the first season to this one, newest first", () => {
    const years = boards.filter((b) => b.ownSeason).map((b) => Number(b.key));
    expect(years).toEqual(
      [...years].sort((a, b) => b - a),
    );
    expect(years.at(-1)).toBe(2015);
  });

  it("keeps one board for every season at once, and only that one ranks all time", () => {
    const allTime = boards.filter((b) => !b.ownSeason);
    expect(allTime).toHaveLength(1);
    expect(allTime[0].key).toBe(OVERALL_BOARD.key);
    expect(allTime[0].trackLeaderboard).toBe(false);
  });
});
