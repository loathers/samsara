import { checkPlayers } from "./utils/client.js";

const STARTING_ID = 6;

function* counter(startFrom = 1) {
  while (true) yield startFrom++;
}

async function main() {
  await checkPlayers(counter(STARTING_ID));
}

main();
