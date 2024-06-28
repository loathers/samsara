import { db } from "~/db.server.js";
import {
  parseAscensions,
  parsePlayer,
  rolloverSafeFetch,
  wait,
} from "./utils.js";
import { parseWorkers } from "./Worker.js";
import { Ascension } from "@prisma/client";

// KoL used to purge accounts from inactivity and even now, sometimes accounts are purged. This is a sufficiently late known account
// to let us know when to stop skipping gaps. If we ever encounter a future gap, this should be updated to have a greater value.
const LATEST_KNOWN_ACCOUNT = 3726568;

export const workers = parseWorkers(process.env);

export async function checkPlayers(
  ids: Generator<number>,
  stopOnBlank = true,
  ascensionUpdater?: (ascensions: Ascension[]) => Promise<number>,
) {
  let shouldStop = false;

  for (const id of ids) {
    if (shouldStop && stopOnBlank) break;

    // Wait for a worker to become available
    while (workers.every((w) => w.isBusy())) await wait(1);

    const available = workers.find((w) => !w.isBusy())!;

    available.run(async (client) => {
      const pre = await rolloverSafeFetch(
        client,
        `ascensionhistory.php?who=${id}&prens13=1`,
      );

      // Check the player here, no sense in trying post-NS13 if they don't exist.
      const player = parsePlayer(pre);

      if (player === null) {
        if (id >= LATEST_KNOWN_ACCOUNT) {
          console.log(
            `Found blank id ${id} after the last known account id${stopOnBlank ? ` - stopping` : ""}`,
          );
          shouldStop = true;
        }
        return;
      }

      const post = await rolloverSafeFetch(
        client,
        `ascensionhistory.php?who=${id}`,
      );

      // Parse and merge pre and post NS13 ascensions
      const ascensions = [
        ...parseAscensions(pre, player.id),
        ...parseAscensions(post, player.id),
      ];

      // We care not for non-ascenders
      if (ascensions.length === 0) {
        console.log(
          `Skipped ${player.name} (${player.id}) as they have never ascended`,
        );
        return;
      }

      // Upsert in case the player name has changed
      await db.player.upsert({
        create: player,
        update: { name: player.name },
        where: { id: player.id },
      });

      let added = 0;

      if (ascensionUpdater) {
        // We are correcting a parsing issue, so we can't skip duplicates
        added = await ascensionUpdater(ascensions);
      } else {
        // Ascensions never change, so we can skip duplicates
        const { count } = await db.ascension.createMany({
          data: ascensions,
          skipDuplicates: true,
        });
        added = count;
      }

      console.log(
        `Processed ${ascensions.length} (${added} new) ascensions for ${player.name} (${player.id})`,
      );
    });
  }
}
