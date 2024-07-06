import { db } from "~/db.server.js";
import {
  parseAscensions,
  parsePlayer,
  rolloverSafeFetch,
  slugify,
  wait,
} from "./utils.js";
import { parseWorkers } from "./Worker.js";
import { Ascension } from "@prisma/client";
import { fetchClasses, fetchPaths } from "./data.js";
import { tagAscensions } from "./tagger.js";

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

  const paths = (await db.path.findMany({ select: { name: true } })).map(
    (p) => p.name,
  );

  const classes = (await db.class.findMany({ select: { name: true } })).map(
    (c) => c.name,
  );

  for (const id of ids) {
    if (shouldStop) break;

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
          shouldStop = stopOnBlank;
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

      const newPaths = ascensions.filter((a) => !paths.includes(a.pathName));

      if (newPaths.length > 0) {
        const firstPerNewPath = Object.values(
          newPaths.reduce(
            (acc, a) => {
              if (a.pathName in acc) return acc;
              return { ...acc, [a.pathName]: a };
            },
            {} as Record<string, Ascension>,
          ),
        );

        await db.path.createMany({
          data: firstPerNewPath.map((a) => ({
            name: a.pathName,
            slug: slugify(a.pathName),
          })),
          skipDuplicates: true,
        });
        paths.push(...newPaths.map((a) => a.pathName));
      }

      const newClasses = ascensions.filter(
        (a) => !classes.includes(a.className),
      );
      if (newClasses.length > 0) {
        const firstPerNewPerClass = Object.values(
          newClasses.reduce(
            (acc, a) => {
              if (a.className in acc) return acc;
              return { ...acc, [a.className]: a };
            },
            {} as Record<string, Ascension>,
          ),
        );

        await db.class.createMany({
          data: firstPerNewPerClass.map((a) => ({
            name: a.className,
          })),
          skipDuplicates: true,
        });
        classes.push(...newClasses.map((a) => a.className));
      }

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

  await Promise.all([updatePaths(), updateClasses(), tagAscensions()]);
}

async function guessPathDates() {
  await db.$transaction([
    db.path.updateMany({
      where: {
        name: {
          in: [
            "None",
            "Boozetafarian",
            "Teetotaler",
            "Bad Moon",
            "Oxygenarian",
          ],
        },
      },
      data: { seasonal: false, start: { set: null }, end: { set: null } },
    }),

    db.path.updateMany({
      where: { name: "Standard" },
      data: { seasonal: true, start: null, end: null },
    }),
  ]);

  const paths = await db.path.findMany({
    where: {
      start: null,
      seasonal: true,
      name: { not: "Standard" },
    },
    include: {
      ascensions: { select: { date: true }, orderBy: { date: "asc" }, take: 1 },
    },
  });

  const updates = paths.map((path) => {
    const { date } = path.ascensions[0];

    const start = new Date(date);
    start.setDate(15);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);
    end.setDate(14);

    return db.path.update({
      where: { name: path.name },
      data: { start, end },
    });
  });

  await db.$transaction(updates);
}

async function fetchExtraPathData() {
  const knownPaths = await fetchPaths();
  if (!knownPaths) return;
  const pathMap = new Map(knownPaths.map((p) => [p.name, p]));

  // This path gets a shorter name in ascension logs
  pathMap.set("Class Act II", pathMap.get("Class Act II: A Class For Pigs")!);

  await db.$transaction(async (tx) => {
    const paths = await tx.path.findMany({ where: { image: null } });

    for (const path of paths) {
      const knownPath = pathMap.get(path.name);
      if (!knownPath) continue;

      await tx.path.update({
        where: { name: path.name },
        data: { image: knownPath.image, id: knownPath.id },
      });
    }
  });
}

export async function updatePaths() {
  // Add start and end dates to paths
  await guessPathDates();
  await fetchExtraPathData();
}

export async function updateClasses() {
  const knownClasses = await fetchClasses();
  if (!knownClasses) return;
  const classMap = new Map(knownClasses.map((p) => [p.name, p]));

  // DoL's name doesn't match up on some things
  classMap.set("Actually Ed the Undying", classMap.get("Ed the Undying")!);
  classMap.set("Grey You", classMap.get("Grey Goo")!);

  await db.$transaction(async (tx) => {
    const classes = await tx.class.findMany({ where: { image: null } });

    for (const clazz of classes) {
      const knownClass = classMap.get(clazz.name);
      if (!knownClass) continue;

      // Abandoned runs get a None class
      if (knownClass.name === "None") continue;

      await tx.class.update({
        where: { name: clazz.name },
        // Path 0 is also null
        data: {
          image: knownClass.image,
          id: knownClass.id,
          pathId: knownClass.path || null,
        },
      });
    }
  });
}
