import { describe, expect, it } from "vitest";

import { Lifestyle } from "./db";

import {
  formatClassComparison,
  formatExtra,
  getExtraEntries,
  getPathAcronym,
} from "./utils";

describe("getPathAcronym", () => {
  it.each([
    ["Wildfire", "WF"],
    ["Z is for Zootomist", "Zoot"],
    ["Avatar of Shadows Over Loathing", "AoSOL"],
    ["Actually Ed the Undying", "Ed"],
    ["Class Act II", "CA2"],
    ["License to Adventure", "LtA"],
    ["Standard", "Std"],
    ["A Shrunken Adventurer am I", "Smol"],
    ["Pocket Familiars", "PF"],
    ["11,037 Leagues Under the Sea", "Sea"],
    ["Adventurer Meats World", "Meat"],
  ])("Correctly shortens %s", (path, expected) => {
    expect(getPathAcronym(path)).toBe(expected);
  });
});

describe("formatExtra", () => {
  it("formats a string value", () => {
    expect(formatExtra({ Team: "Red" })).toBe("Team: Red");
  });

  it("groups the thousands in a numeric value", () => {
    expect(formatExtra({ "Goo Score": 2965 })).toBe("Goo Score: 2,965");
  });

  it("comma-joins multiple entries", () => {
    expect(formatExtra({ Fun: 1087, Team: "Blue" })).toBe(
      "Fun: 1,087, Team: Blue",
    );
  });

  it.each([[{}], [null], [[1, 2]]])("returns nothing for %s", (extra) => {
    expect(formatExtra(extra)).toBe("");
  });

  it("omits the requested keys", () => {
    expect(formatExtra({ Fun: 1087, Team: "Blue" }, ["Fun"])).toBe("Team: Blue");
  });

  it("returns nothing once every key is omitted", () => {
    expect(formatExtra({ "Goo Score": 2965 }, ["Goo Score"])).toBe("");
  });
});

describe("getExtraEntries", () => {
  it("returns the entries, less the omitted keys", () => {
    expect(getExtraEntries({ Fun: 1087, Team: "Blue" }, ["Fun"])).toEqual([
      ["Team", "Blue"],
    ]);
  });

  it.each([[{}], [null], [[1, 2]]])("returns nothing for %s", (extra) => {
    expect(getExtraEntries(extra)).toEqual([]);
  });
});

describe("formatClassComparison", () => {
  const row = {
    share: 0.25,
    winRate: 0.5,
    turnDelta: 0,
    year: 2026,
    lifestyle: Lifestyle.SOFTCORE,
  };

  it("reports the share of runs beaten", () => {
    expect(formatClassComparison({ ...row, winRate: 0.575 }).headline).toBe(
      "Beats 58% of the same players' other 2026 softcore runs",
    );
  });

  it("calls a near-even split even", () => {
    expect(formatClassComparison({ ...row, winRate: 0.503 }).headline).toBe(
      "An even match for the same players' other 2026 softcore runs",
    );
  });

  it("names the season it compares against", () => {
    expect(
      formatClassComparison({ ...row, year: 2019, lifestyle: Lifestyle.HARDCORE })
        .headline,
    ).toContain("other 2019 hardcore runs");
  });

  it("reports the turn saving at the best daycount", () => {
    expect(formatClassComparison({ ...row, turnDelta: -12.4 }).detail).toBe(
      "12 fewer turns on average, at best daycount per player",
    );
  });

  it("reports a turn cost the same way", () => {
    expect(formatClassComparison({ ...row, turnDelta: 12.4 }).detail).toBe(
      "12 more turns on average, at best daycount per player",
    );
  });

  it("omits the turn line when no daycount was shared", () => {
    expect(formatClassComparison({ ...row, turnDelta: null }).detail).toBeNull();
  });

  it("always reports the share of runs", () => {
    expect(formatClassComparison({ ...row, share: 0.442 }).share).toBe(
      "44% of runs on this board",
    );
  });

  it("says so when too few players explored", () => {
    expect(formatClassComparison({ ...row, winRate: null }).headline).toBe(
      "Too few players ran several classes to compare",
    );
  });

  it("drops the year from the phrasing on boards without one", () => {
    expect(
      formatClassComparison({ ...row, year: null, winRate: 0.62 }).headline,
    ).toBe(
      "Beats 62% of the same players' other runs on this path",
    );
  });
});
