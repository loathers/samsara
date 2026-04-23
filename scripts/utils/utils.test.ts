import { describe, expect, it } from "vitest";

import { slugify } from "./utils.js";

describe("Slugify", () => {
  it("can slugify a simple path name", () => {
    expect(slugify("The Source")).toBe("the-source");
  });

  it("can slugify a path name with punctuation", () => {
    expect(slugify("You, Robot")).toBe("you-robot");
  });

  it("can slugify a path name with numbers", () => {
    expect(slugify("11 Things I Hate About U")).toBe(
      "11-things-i-hate-about-u",
    );
  });
});
