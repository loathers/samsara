import { tagAscensions } from "./utils/tagger";

async function main() {
  console.time("etl");
  console.timeLog("etl", "Begin");
  await tagAscensions(false);
  console.timeLog("etl", "Done");
  console.timeEnd("etl");
}

main();
