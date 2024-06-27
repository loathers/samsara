import { checkPlayers } from "./utils/client.js";

const STARTING_ID = 6;

function* counter(startFrom = 1) {
  while (true) yield startFrom++;
}

async function main() {
  const startingId = parseInt(process.argv[2]) || STARTING_ID;
  await checkPlayers(counter(startingId));
}

main();
