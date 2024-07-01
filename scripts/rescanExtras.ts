import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { checkPlayers } from "./utils/client.js";
import { db } from "~/db.server.js";

function* players(p: { playerId: number }[]) {
  for (const player of p) yield player.playerId;
}

function isObject(obj: JsonValue): obj is JsonObject {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

async function main() {
  const needRechecked = await db.$queryRaw<{ playerId: number }[]>`
    SELECT DISTINCT "playerId" FROM "Ascension"
    WHERE
      (path = 'Grey Goo' AND extra->>'Goo Score' is null) OR
      (path = 'One Crazy Random Summer' AND extra ->>'Fun' is null)
  `;

  await checkPlayers(
    players(needRechecked),
    false,
    false,
    async (ascensions) => {
      const relevant = ascensions
        .filter(
          (a) =>
            isObject(a.extra) &&
            (a.pathName === "Grey Goo" ||
              a.pathName === "One Crazy Random Summer"),
        )
        .map((a) =>
          db.ascension.upsert({
            where: {
              id: { ascensionNumber: a.ascensionNumber, playerId: a.playerId },
            },
            create: {
              ...a,
              extra: a.extra as JsonObject,
            },
            update: {
              extra: a.extra as JsonObject,
            },
          }),
        );

      await db.$transaction(relevant);

      return relevant.length;
    },
  );
}

main();
