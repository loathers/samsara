import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { parseAscensionPage } from "./utils.js";
import { join } from "node:path";
import { Ascension } from "@prisma/client";

async function loadFixture(path: string) {
  return await readFile(
    join(import.meta.dirname, `__fixtures__/${path}`),
    "utf8",
  );
}

describe("Ascension Page Parsing", () => {
  let gausieAscensions: Ascension[];
  beforeAll(async () => {
    const page = await loadFixture("gausie_post_ns13_ascensionhistory.html");

    gausieAscensions = parseAscensionPage(page);
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
    const ascensions = parseAscensionPage(page);
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
      const ascensions = parseAscensionPage(page);
      expect(ascensions).toHaveLength(0);
    },
  );

  it("can recognise an abandoned run", async () => {
    const page = await loadFixture("ascensionhistory_with_abandoned.html");
    const ascensions = parseAscensionPage(page);
    const abandoned = ascensions.find((a) => a.ascensionNumber === 49);
    expect(abandoned).toBeDefined();
    expect(abandoned).toHaveProperty("abandoned", true);
  });
});
