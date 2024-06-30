import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import {
  parseAscensions,
  parsePlayer,
  parseRecentAscenders,
  slugify,
} from "./utils.js";
import { join } from "node:path";
import { Ascension } from "@prisma/client";

async function loadFixture(path: string) {
  return await readFile(
    join(import.meta.dirname, `__fixtures__/${path}`),
    "utf8",
  );
}

describe("Utils", () => {
  let gausiePage: string;
  beforeAll(async () => {
    gausiePage = await loadFixture("gausie_post_ns13_ascensionhistory.html");
  });

  describe("Parsing ascension history", () => {
    let gausieAscensions: Ascension[];

    beforeAll(() => {
      gausieAscensions = parseAscensions(gausiePage, 1197090);
    });

    it("should parse a long ascension page correctly", () => {
      expect(gausieAscensions).toHaveLength(1112);
    });

    it("can recognise a dropped run", () => {
      const dropped = gausieAscensions.find((a) => a.ascensionNumber === 13);
      expect(dropped).toHaveProperty("dropped", true);
    });

    it("can recognise a pre-NS13 run with no sign", async () => {
      const page = await loadFixture("gausie_pre_ns13_ascensionhistory.html");
      const ascensions = parseAscensions(page, 1197090);
      const dropped = ascensions.find((a) => a.ascensionNumber === 1);
      expect(dropped).toHaveProperty("sign", "None");
    });

    it("can parse a run with an extra-wide familiar icon", async () => {
      const camel = gausieAscensions.find((a) => a.ascensionNumber === 288);

      expect(camel).toHaveProperty("familiar", "Melodramedary");
      expect(camel).toHaveProperty("familiarPercentage", 17.5);
    });

    it.each(["before", "after"])(
      "can parse an account that has not ascended %s NS13",
      async (relativeToNS13) => {
        const page = await loadFixture(
          `ascensionhistory_none_${relativeToNS13}_ns13.html`,
        );
        const ascensions = parseAscensions(page, 1199739);
        expect(ascensions).toHaveLength(0);
      },
    );

    it("can recognise an abandoned run", async () => {
      const page = await loadFixture("ascensionhistory_with_abandoned.html");
      const ascensions = parseAscensions(page, 725488);
      const abandoned = ascensions.find((a) => a.ascensionNumber === 49);
      expect(abandoned).toBeDefined();
      expect(abandoned).toHaveProperty("abandoned", true);
    });

    it("can parse a run with two asterisks", async () => {
      const page = await loadFixture("ascensionhistory_two_asterisks.html");
      const ascensions = parseAscensions(page, 2026359);
      const dropped = ascensions.find((a) => a.ascensionNumber === 113);
      expect(dropped).toBeDefined();
      expect(dropped).toHaveProperty("dropped", true);
    });

    it('can parse a Grey Goo "Goo Score"', async () => {
      const goo = gausieAscensions.find((a) => a.ascensionNumber === 275);
      expect(goo).toBeDefined();
      expect(goo?.extra).toEqual({
        "Goo Score": 9950,
      });
    });

    it('can parse a One Crazy Random Summer "Fun" score', async () => {
      const ocrs = gausieAscensions.find((a) => a.ascensionNumber === 279);
      expect(ocrs).toBeDefined();
      expect(ocrs?.extra).toEqual({
        Fun: 7018,
      });
    });
  });

  describe("Parsing the player", () => {
    it("can parse a player name and id", async () => {
      const player = parsePlayer(gausiePage);
      expect(player).toEqual({ id: 1197090, name: "gAUSIE" });
    });

    it("can parse a player with no ascensions", async () => {
      const page = await loadFixture("ascensionhistory_none_before_ns13.html");
      const player = parsePlayer(page);
      expect(player).toEqual({ id: 1199739, name: "onweb" });
    });

    it("can gracefully fails to parse a manually elided player", async () => {
      const page = await loadFixture("ascensionhistory_jick.html");
      const player = parsePlayer(page);
      expect(player).toBe(null);
    });

    it("can gracefully fail to parse a purged player", async () => {
      const page = await loadFixture("ascensionhistory_purged.html");
      const player = parsePlayer(page);
      expect(player).toBe(null);
    });
  });

  describe("Parsing recent ascensions", () => {
    it("can parse a list of recent ascensions", async () => {
      const page = await loadFixture("museum_recent_ascensions.html");

      const ascensions = parseRecentAscenders(page);

      // Though the list is of 500 ascensions, it yields 405 unique ascenders.
      expect(ascensions).toHaveLength(405);
    });
  });

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
});
