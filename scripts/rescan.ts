import { checkPlayers } from "./utils/client.js";

function* counter(startFrom = 1) {
  while (true) yield startFrom++;
}

async function main() {
  let startingId = 6;

  await checkPlayers(counter(startingId));
}

main();
