import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOARD,
  boardHash,
  boardTitle,
  boardsFor,
  findBoard,
  tagHash,
  yearBoard,
} from "./boards";

describe("boardsFor", () => {
  it("gives a path that declares no boards a single unnamed one", () => {
    expect(boardsFor({ name: "Wildfire" })).toEqual([DEFAULT_BOARD]);
  });

  it("gives Blue vs. Red a board per team", () => {
    expect(boardsFor({ name: "Blue vs. Red" }).map((b) => b.key)).toEqual([
      "blue",
      "red",
    ]);
  });

  it("puts the Sea's true board first, so it takes the unprefixed hashes", () => {
    expect(boardsFor({ name: "11,037 Leagues Under the Sea" })[0].key).toBe(
      "post-nerf",
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
    expect(boardHash("blue", "pyrites")).toBe("blue-pyrites");
  });
});

describe("findBoard", () => {
  it("resolves a key back to its board", () => {
    expect(findBoard("Blue vs. Red", "red")?.label).toBe("Red Team");
  });

  it("is undefined for an untagged board or an undeclared path", () => {
    expect(findBoard("Blue vs. Red", null)).toBeUndefined();
    expect(findBoard("Wildfire", "blue")).toBeUndefined();
    // Standard's year boards are generated, not declared.
    expect(findBoard("Standard", "2024")).toBeUndefined();
  });
});

describe("tagHash", () => {
  // A medal must never link to a section the path page does not render, so these have
  // to agree with what boardHash produces for the same board.
  it("matches the section a single-board path renders", () => {
    expect(tagHash("LEADERBOARD", null)).toBe("leaderboards");
    expect(tagHash("PYRITE", null)).toBe("pyrites");
  });

  it("matches the section a named board renders", () => {
    expect(tagHash("LEADERBOARD", "blue")).toBe(
      boardHash("blue", "leaderboards"),
    );
    expect(tagHash("PYRITE", "pre-nerf")).toBe(
      boardHash("pre-nerf", "pyrites"),
    );
  });

  it("sends the special rankings to the same sections as their plain siblings", () => {
    expect(tagHash("LEADERBOARD_SPECIAL", null)).toBe("leaderboards");
    expect(tagHash("PYRITE_SPECIAL", null)).toBe("pyrites");
  });

  it("sends Standard to its year", () => {
    expect(tagHash("STANDARD", "2024")).toBe("2024");
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
