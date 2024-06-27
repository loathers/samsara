import { db } from "~/db.server.js";
import { checkPlayers } from "./utils/client.js";
import { program } from "commander";

type OptionValues = {
  startingId: number;
  force: boolean;
};

const cli = program
  .option(
    "-s, --starting-id <id>",
    "Player id from which to iterate when scanning",
    parseInt,
    6,
  )
  .option("--force", "Force rescan of all players", false)
  .parse();

function* counter(startFrom = 1, skip: number[] = []) {
  while (true) if (!skip.includes(startFrom)) yield startFrom++;
}

async function main() {
  const options = cli.opts<OptionValues>();

  const skip = options.force
    ? []
    : (await db.player.findMany({})).map((player) => player.id);

  await checkPlayers(counter(options.startingId, skip));
}

main();
