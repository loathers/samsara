import { program } from "commander";

import { db, processAscensions, workers } from "./utils/client.js";

type OptionValues = {
  startingId: number;
  force: boolean;
};

const cli = program
  .option(
    "-s, --starting-id <id>",
    "Player id from which to iterate when scanning",
    (v) => parseInt(v),
    6,
  )
  .option("--force", "Force rescan of all players", false)
  .parse();

function* counter(startFrom = 1, skip: number[] = []) {
  while (true) {
    if (!skip.includes(startFrom)) yield startFrom;
    startFrom++;
  }
}

async function main() {
  if (workers.length === 0) {
    console.error("No workers available, exiting");
    return;
  }

  const { startingId, force } = cli.opts<OptionValues>();

  console.time("etl");
  console.timeLog("etl", "Begin");

  const skip = force
    ? []
    : (await db.player.findMany({})).map((player) => player.id);

  await processAscensions(counter(startingId, skip));

  console.timeLog("etl", "Done");
  console.timeEnd("etl");
}

main();
