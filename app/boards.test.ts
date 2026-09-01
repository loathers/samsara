import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOARD,
  OVERALL_BOARD,
  PATH_BOARDS,
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
    for (const boards of PATH_BOARDS.values()) {
      const overall = boards.indexOf(OVERALL_BOARD);
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
    expect(tagHash("Blue vs. Red", "PYRITE", "overall")).toBe(
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
    expect(findBoard("Standard", "2024")).toBeUndefined();
  });
});

describe("tagHash", () => {
  it("matches the section a single-board path renders", () => {
    expect(tagHash("Wildfire", "LEADERBOARD", null)).toBe("leaderboards");
    expect(tagHash("Wildfire", "PYRITE", null)).toBe("pyrites");
  });

  it("matches the section a named board renders", () => {
    expect(tagHash("Blue vs. Red", "LEADERBOARD", "blue")).toBe(
      boardHash("blue", "leaderboards"),
    );
    expect(
      tagHash("11,037 Leagues Under the Sea", "PYRITE", "pre-nerf"),
    ).toBe(boardHash("pre-nerf", "pyrites"));
  });

  it("sends the special rankings to the same sections as their plain siblings", () => {
    expect(tagHash("Grey Goo", "LEADERBOARD_SPECIAL", null)).toBe(
      "leaderboards",
    );
    expect(tagHash("Grey Goo", "PYRITE_SPECIAL", null)).toBe("pyrites");
  });

  it("sends Standard to its year", () => {
    expect(tagHash("Standard", "STANDARD", "2024")).toBe("2024");
  });

  it("splits One Crazy Random Summer by the measure it ranked", () => {
    expect(tagHash("One Crazy Random Summer", "PYRITE_SPECIAL", null)).toBe(
      "fun-pyrites",
    );
    expect(tagHash("One Crazy Random Summer", "PYRITE", null)).toBe(
      "time-pyrites",
    );
    expect(
      tagHash("One Crazy Random Summer", "LEADERBOARD_SPECIAL", null),
    ).toBe("fun-leaderboards");
    expect(tagHash("One Crazy Random Summer", "LEADERBOARD", null)).toBe(
      "time-leaderboards",
    );
  });

  it("follows Bad Moon's board-first layout", () => {
    expect(tagHash("Bad Moon", "PYRITE", "kittycore")).toBe(
      "kittycore.leaderboard",
    );
    expect(tagHash("Bad Moon", "PYRITE", "overall")).toBe("leaderboard");
  });

  it("keeps every override pointing at a section its route renders", () => {
    expect(hashSection(tagHash("Bad Moon", "PYRITE", "kittycore")!)).toBe(
      "kittycore",
    );
    expect(
      hashSection(tagHash("One Crazy Random Summer", "PYRITE", null)!),
    ).toBe("time-pyrites");
  });
});

describe("yearBoard", () => {
  it("bounds a Standard season to its calendar year", () => {
    expect(yearBoard(2024)).toEqual({
      key: "2024",
      label: "2024",
      dateRange: { from: "2024-01-01", to: "2024-12-31" },
    });
  });
});
