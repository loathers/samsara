import { sql } from "kysely";

import { JsonObject, JsonValue } from "../app/db.js";
import { db, processAscensions, workers } from "./utils/client.js";

function* players(p: { playerId: number }[]) {
  for (const player of p) yield player.playerId;
}

function isObject(obj: JsonValue): obj is JsonObject {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

async function main() {
  if (workers.length === 0) {
    console.error("No workers available, exiting");
    return;
  }

  const needRechecked = await db
    .selectFrom("Ascension")
    .select("playerId")
    .distinct()
    .where(({ eb, or, and }) =>
      or([
        and([eb("pathName", "=", "Grey Goo"), eb(sql`"extra"->>'Goo Score'`, "is", null)]),
        and([eb("pathName", "=", "One Crazy Random Summer"), eb(sql`"extra"->>'Fun'`, "is", null)]),
      ]),
    )
    .execute();

  await processAscensions(players(needRechecked), {
    stopOnBlank: false,
    ascensionUpdater: async (ascensions) => {
      const relevant = ascensions.filter(
        (a) =>
          isObject(a.extra) &&
          (a.pathName === "Grey Goo" || a.pathName === "One Crazy Random Summer"),
      );

      await db.transaction().execute(async (trx) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const { familiarImage, ...a } of relevant) {
          await trx
            .insertInto("Ascension")
            .values({ ...a, extra: a.extra as JsonObject })
            .onConflict((oc) =>
              oc.columns(["ascensionNumber", "playerId"]).doUpdateSet({ extra: a.extra as JsonObject }),
            )
            .execute();
        }
      });

      return relevant.length;
    },
  });
}

main();
