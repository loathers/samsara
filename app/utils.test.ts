import { describe, expect, it } from "vitest";

import { getPathAcronym } from "./utils";

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
  ])("Correctly shortens %s", (path, expected) => {
    expect(getPathAcronym(path)).toBe(expected);
  });
});
