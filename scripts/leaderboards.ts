import { Player } from "@prisma/client";

import { processAscensions, workers } from "./utils/client.js";

function* players(p: Player[]) {
  const seen = new Set<number>();
  for (const player of p) {
    // Skip clan leaderboards
    if (Number.isNaN(player.id)) continue;
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    yield player.id;
  }
}

async function main() {
  if (workers.length === 0) {
    console.error("No workers available, exiting");
    return;
  }

  console.time("etl");
  console.timeLog("etl", "Begin");

  const ascenders: Player[] = [];

  let i = 0;
  let zeroFor = 0;

  while (zeroFor < 10) {
    const client = workers[0];
    const leaderboard = await client.getLeaderboard(++i);
    const leaderboardees = leaderboard.boards.flatMap((lb) =>
      lb.runs.map((run) => ({ id: run.playerId, name: run.playerName })),
    );

    if (leaderboardees.length === 0) {
      zeroFor++;
    } else {
      ascenders.push(...leaderboardees);
      zeroFor = 0;
    }

    console.timeLog(
      "etl",
      `Fetched leaderboard ${i}, found ${leaderboardees.length} ascenders`,
    );
  }

  if (ascenders.length === 0) {
    console.timeLog("etl", "No ascenders found, this is weird");
  } else {
    console.timeLog("etl", `Found ${ascenders.length} ascenders`);

    await processAscensions(players(ascenders), {
      stopOnBlank: false,
      sendWebhook: false,
    });
  }

  console.timeLog("etl", "Done");
  console.timeEnd("etl");
}

main();
