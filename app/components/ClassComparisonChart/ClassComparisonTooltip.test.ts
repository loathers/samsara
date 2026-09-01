import { describe, expect, it } from "vitest";

import { Lifestyle } from "~/db";

import { formatClassComparison } from "./ClassComparisonTooltip";

describe("formatClassComparison", () => {
  const row = {
    year: 2026,
    lifestyle: Lifestyle.SOFTCORE,
    className: "Seal Clubber",
    classImage: "club",
    share: 0.25,
    winRate: 0.5,
    turnDelta: 0,
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

  it("drops the year from the phrasing on boards without one", () => {
    expect(
      formatClassComparison({ ...row, year: null, winRate: 0.62 }).headline,
    ).toBe("Beats 62% of the same players' other runs on this path");
  });

  it("says so when too few players explored", () => {
    expect(formatClassComparison({ ...row, winRate: null }).headline).toBe(
      "Too few players ran several classes to compare",
    );
  });

  it("always reports the share of runs", () => {
    expect(formatClassComparison({ ...row, share: 0.442 }).share).toBe(
      "44% of runs on this board",
    );
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
});
