import { Player } from "@prisma/client";
import { checkPlayers, workers } from "./utils/client.js";
import { parseRecentAscenders } from "./utils/utils.js";

const kol = workers[0];

function* players(p: Player[]) {
  for (const player of p) yield player.id;
}

async function main() {
  const recent = await kol.fetchText(
    "museum.php?place=leaderboards&whichboard=999&showhist=500",
  );

  if (kol.isRollover()) {
    console.log("Rollover detected, exiting");
    return;
  }

  const ascenders = parseRecentAscenders(recent);

  await checkPlayers(players(ascenders), false, true);
}

main();
