import { describe, expect, it } from "vitest";

import { formatExtra, getExtraEntries, getPathAcronym } from "./utils";

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
