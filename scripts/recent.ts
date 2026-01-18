import { Player } from "@prisma/client";

import {
  db,
  nextUpdateIn,
  processAscensions,
  workers,
} from "./utils/client.js";
import { parseRecentAscenders } from "./utils/utils.js";

function* players(p: Player[]) {
  for (const player of p) yield player.id;
}

async function main() {
  if (workers.length === 0) {
    console.error("No workers available, exiting");
    return;
  }

  console.time("etl");
  console.timeLog("etl", "Begin");

  let recent = "";
  let i = 0;
  while (recent === "" && i < 10) {
    const client = workers[i++ % workers.length];
    recent = await client.fetchText(
      "museum.php?place=leaderboards&whichboard=999&showhist=500",
    );

    if (recent !== "" && client.isRollover()) {
      console.timeLog("etl", "Rollover detected, exiting");
      console.timeEnd("etl");
      return;
    }
  }

  const ascenders = parseRecentAscenders(recent);

  if (ascenders.length === 0) {
    console.timeLog("etl", "No ascenders found, this is weird");
  } else {
    console.timeLog("etl", `Found ${ascenders.length} ascenders`);

    await processAscensions(players(ascenders), {
      stopOnBlank: false,
      sendWebhook: true,
    });
  }

  await nextUpdateIn(Number(process.env.SCHEDULE || 1800));
  console.timeLog("etl", "Done");
  console.timeEnd("etl");
}

try {
  await main();
} finally {
  await db.$disconnect();
}
