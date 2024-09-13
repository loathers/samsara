import { Player } from "@prisma/client";
import { processAscensions, nextUpdateIn, workers } from "./utils/client.js";
import { parseRecentAscenders } from "./utils/utils.js";

const client = workers[0];

function* players(p: Player[]) {
  for (const player of p) yield player.id;
}

async function main() {
  console.time("etl");
  console.timeLog("etl", "Begin")

  const recent = await client.fetchText(
    "museum.php?place=leaderboards&whichboard=999&showhist=500",
  );

  if (client.isRollover()) {
    console.timeLog("etl", "Rollover detected, exiting");
    console.timeEnd("etl");
    return;
  }

  const ascenders = parseRecentAscenders(recent);

  console.timeLog("etl", `Found ${ascenders.length} ascenders`);

  await processAscensions(players(ascenders), false);

  await nextUpdateIn(Number(process.env.SCHEDULE || 1800));
  console.timeLog("etl", "Done");
  console.timeEnd("etl");
}

main();
