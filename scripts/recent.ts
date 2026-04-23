import { Leaderboard } from "kol.js/domains/Leaderboard";

import {
  db,
  nextUpdateIn,
  processAscensions,
  workers,
} from "./utils/client.js";

function* playerIds(players: { id: number }[]) {
  for (const player of players) yield player.id;
}

async function main() {
  if (workers.length === 0) {
    console.error("No workers available, exiting");
    return;
  }

  console.time("etl");
  console.timeLog("etl", "Begin");

  const ascenders = await new Leaderboard(workers[0]).getRecent();

  if (ascenders.length === 0) {
    console.timeLog("etl", "No ascenders found, this is weird");
  } else {
    console.timeLog("etl", `Found ${ascenders.length} ascenders`);

    await processAscensions(playerIds(ascenders), {
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
  await db.destroy();
}
