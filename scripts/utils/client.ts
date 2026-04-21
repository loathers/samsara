import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { Database, Player } from "../../app/db.js";
import { parseWorkers } from "./Worker.js";
import { fetchClasses, fetchPaths } from "./data.js";
import { tagAscensions } from "./tagger.js";
import {
  type Ascension,
  parseAscensions,
  parsePlayer,
  rolloverSafeFetch,
  slugify,
  wait,
} from "./utils.js";

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }),
  }),
});

// KoL used to purge accounts from inactivity and even now, sometimes accounts are purged. This is a sufficiently late known account
// to let us know when to stop skipping gaps. If we ever encounter a future gap, this should be updated to have a greater value.
const LATEST_KNOWN_ACCOUNT = 3726568;

export const workers = parseWorkers(process.env);

export async function nextUpdateIn(seconds: number) {
  const timestamp = Date.now() + seconds * 1000;
  await db
    .insertInto("Setting")
    .values({ key: "nextUpdate", value: timestamp.toString() })
    .onConflict((oc) => oc.column("key").doUpdateSet({ value: timestamp.toString() }))
    .execute();
}

export async function processPlayers(
  ids: Generator<number>,
  stopOnBlank = true,
  ascensionUpdater?: (ascensions: Ascension[]) => Promise<number>,
) {
  let shouldStop = false;

  console.timeLog("etl", `Updating ascensions`);

  const paths = (
    await db.selectFrom("Path").select("name").execute()
  ).map((p) => p.name);

  const classes = (
    await db.selectFrom("Class").select("name").execute()
  ).map((c) => c.name);

  const familiars = (
    await db.selectFrom("Familiar").select("name").execute()
  ).map((f) => f.name);

  const familiarsWithImage = (
    await db.selectFrom("Familiar").select("name").where("image", "!=", "nopic").execute()
  ).map((f) => f.name);

  const players: Player[] = [];
  const ascensions: Ascension[] = [];

  for (const id of ids) {
    if (shouldStop) break;

    // Wait for a worker to become available
    while (workers.every((w) => w.isBusy())) await wait(1);

    const available = workers.find((w) => !w.isBusy())!;

    available.run(async (client) => {
      console.timeLog("etl", `  Checking ${id}`);
      const pre = await rolloverSafeFetch(
        client,
        `ascensionhistory.php?who=${id}&prens13=1`,
      );

      // Check the player here, no sense in trying post-NS13 if they don't exist.
      const player = parsePlayer(pre);

      if (player === null) {
        if (id >= LATEST_KNOWN_ACCOUNT) {
          console.timeLog(
            "etl",
            `!! Found blank id ${id} after the last known account id${stopOnBlank ? ` - stopping` : ""}`,
          );
          shouldStop = stopOnBlank;
        } else {
          console.timeLog("etl", `  Finished checking ${id} (blank)`);
        }
        return;
      }

      const post = await rolloverSafeFetch(
        client,
        `ascensionhistory.php?who=${id}`,
      );

      // Parse and merge pre and post NS13 ascensions
      const playerAscensions = [
        ...parseAscensions(pre, player.id),
        ...parseAscensions(post, player.id),
      ];

      // We care not for non-ascenders
      if (playerAscensions.length === 0) {
        console.timeLog(
          "etl",
          `  Skipped ${player.name} (#${player.id}) as they have never ascended`,
        );
        return;
      }

      players.push(player);
      ascensions.push(...playerAscensions);
      console.timeLog("etl", `  Finished checking ${id}`);
    });
  }

  // Wait for all workers to finish
  while (workers.some((w) => w.isBusy())) await wait(1);

  // Upsert all players detected (in case of name change)
  for (const player of players) {
    await db
      .insertInto("Player")
      .values(player)
      .onConflict((oc) => oc.column("id").doUpdateSet({ name: player.name }))
      .execute();
  }

  // Add any new paths or classes
  const newPaths = ascensions.filter((a) => !paths.includes(a.pathName));

  if (newPaths.length > 0) {
    const firstPerNewPath = Object.values(
      newPaths.reduce<Record<string, Ascension>>((acc, a) => {
        if (a.pathName in acc) return acc;
        return { ...acc, [a.pathName]: a };
      }, {}),
    );

    await db
      .insertInto("Path")
      .values(firstPerNewPath.map((a) => ({ name: a.pathName, slug: slugify(a.pathName) })))
      .onConflict((oc) => oc.doNothing())
      .execute();
    paths.push(...newPaths.map((a) => a.pathName));
  }

  const newClasses = ascensions.filter((a) => !classes.includes(a.className));
  if (newClasses.length > 0) {
    const firstPerNewPerClass = Object.values(
      newClasses.reduce<Record<string, Ascension>>((acc, a) => {
        if (a.className in acc) return acc;
        return { ...acc, [a.className]: a };
      }, {}),
    );

    await db
      .insertInto("Class")
      .values(firstPerNewPerClass.map((a) => ({ name: a.className })))
      .onConflict((oc) => oc.doNothing())
      .execute();
    classes.push(...firstPerNewPerClass.map((a) => a.className));
  }

  type FamiliarAscension = Ascension & {
    familiarName: string;
    familiarImage: string;
  };
  const familiarAscensions = ascensions.filter(
    (a) => a.familiarName !== null && a.familiarImage !== null,
  ) as FamiliarAscension[];

  const newFamiliars = familiarAscensions.filter(
    (a) => !familiars.includes(a.familiarName),
  );
  if (newFamiliars.length > 0) {
    const firstPerNewFamiliar = Object.values(
      newFamiliars.reduce<Record<string, FamiliarAscension>>((acc, a) => {
        if (a.familiarName in acc) return acc;
        return { ...acc, [a.familiarName]: a };
      }, {}),
    );
    await db
      .insertInto("Familiar")
      .values(firstPerNewFamiliar.map((a) => ({ name: a.familiarName, image: a.familiarImage })))
      .onConflict((oc) => oc.doNothing())
      .execute();
    familiars.push(...firstPerNewFamiliar.map((a) => a.familiarName));
  }

  const missingImages = familiarAscensions.filter(
    (a) => !familiarsWithImage.includes(a.familiarName),
  );
  if (missingImages.length > 0) {
    const firstPerMissingImage = Object.values(
      missingImages.reduce<Record<string, FamiliarAscension>>((acc, a) => {
        if (a.familiarName in acc) return acc;
        return { ...acc, [a.familiarName]: a };
      }, {}),
    );
    for (const a of firstPerMissingImage) {
      await db
        .insertInto("Familiar")
        .values({ name: a.familiarName, image: a.familiarImage })
        .onConflict((oc) => oc.column("name").doUpdateSet({ image: a.familiarImage }))
        .execute();
    }
    familiarsWithImage.push(...firstPerMissingImage.map((a) => a.familiarName));
  }

  console.timeLog("etl", `  Inserting ascensions to database`);
  let added: number;

  if (ascensionUpdater) {
    // We are correcting a parsing issue, so we can't skip duplicates
    added = await ascensionUpdater(ascensions);
  } else {
    // Ascensions never change, so we can skip duplicates.
    // Chunk to stay under PostgreSQL's 65535-parameter wire protocol limit.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows = ascensions.map(({ familiarImage, ...a }) => a);
    added = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const results = await db
        .insertInto("Ascension")
        .values(rows.slice(i, i + 500))
        .onConflict((oc) => oc.doNothing())
        .execute();
      added += results.reduce((sum, r) => sum + Number(r.numInsertedOrUpdatedRows ?? 0), 0);
    }
  }
  console.timeLog(
    "etl",
    `  Finished inserting ascensions to database (${added} added)`,
  );

  console.timeLog("etl", `Finished updating ascensions`);
}

export async function processAscensions(
  ids: Generator<number>,
  {
    stopOnBlank = true,
    sendWebhook = false,
    ascensionUpdater,
  }: {
    stopOnBlank?: boolean;
    sendWebhook?: boolean;
    ascensionUpdater?: (ascensions: Ascension[]) => Promise<number>;
  } = {},
) {
  await processPlayers(ids, stopOnBlank, ascensionUpdater);
  await Promise.all([
    updatePaths(),
    updateClasses(),
    tagAscensions(sendWebhook),
  ]);
}

async function guessPathDates() {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("Path")
      .set({ seasonal: false, start: null, end: null })
      .where("name", "in", ["None", "Boozetafarian", "Teetotaler", "Bad Moon", "Oxygenarian"])
      .execute();

    await trx
      .updateTable("Path")
      .set({
        seasonal: true,
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      })
      .where("name", "=", "Standard")
      .execute();
  });

  const paths = await db
    .selectFrom("Path")
    .selectAll()
    .where("start", "is", null)
    .where("seasonal", "=", true)
    .where("name", "!=", "Standard")
    .execute();

  const firstAscensionDates = await Promise.all(
    paths.map(async (path) => {
      const row = await db
        .selectFrom("Ascension")
        .select("date")
        .where("pathName", "=", path.name)
        .orderBy("date", "asc")
        .limit(1)
        .executeTakeFirst();
      return { path, date: row?.date };
    }),
  );

  await db.transaction().execute(async (trx) => {
    for (const { path, date } of firstAscensionDates) {
      if (!date) continue;
      const start = new Date(date);
      start.setDate(15);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);
      end.setDate(14);
      await trx
        .updateTable("Path")
        .set({ start, end })
        .where("name", "=", path.name)
        .execute();
    }
  });
}

async function fetchExtraPathData() {
  const knownPaths = await fetchPaths();
  if (!knownPaths) return;
  const pathMap = new Map(knownPaths.map((p) => [p.name, p]));

  // This path gets a shorter name in ascension logs
  pathMap.set("None", pathMap.get("none")!);
  pathMap.set("Class Act II", pathMap.get("Class Act II: A Class For Pigs")!);

  const paths = await db.selectFrom("Path").selectAll().where("image", "is", null).execute();

  await db.transaction().execute(async (trx) => {
    for (const path of paths) {
      const knownPath = pathMap.get(path.name);
      if (!knownPath) continue;
      await trx
        .updateTable("Path")
        .set({ image: knownPath.image, id: knownPath.id })
        .where("name", "=", path.name)
        .execute();
    }
  });
}

export async function updatePaths() {
  console.timeLog("etl", `Updating paths`);
  await guessPathDates();
  await fetchExtraPathData();
  console.timeLog("etl", `Finished updating paths`);
}

export async function updateClasses() {
  const [knownClasses, existingPaths] = await Promise.all([
    fetchClasses(),
    db.selectFrom("Path").select("id").where("id", "is not", null).execute(),
  ]);
  if (!knownClasses) return;
  console.timeLog("etl", `Updating classes`);

  const classMap = new Map(knownClasses.map((p) => [p.name, p]));
  const existingPathIds = new Set(existingPaths.map((p) => p.id));

  // DoL's name doesn't match up on some things
  classMap.set("Actually Ed the Undying", classMap.get("Ed the Undying")!);
  classMap.set("Grey You", classMap.get("Grey Goo")!);

  await db.transaction().execute(async (trx) => {
    const classes = await trx
      .selectFrom("Class")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("image", "is", null),
          eb.and([eb("pathId", "is", null), eb("id", ">", 6)]),
        ]),
      )
      .execute();

    for (const clazz of classes) {
      const knownClass = classMap.get(clazz.name);
      if (!knownClass) continue;

      // Abandoned runs get a None class
      if (knownClass.name === "None") continue;

      // Only set pathId if that path is already in our database
      const pathId = knownClass.path && existingPathIds.has(knownClass.path) ? knownClass.path : null;

      await trx
        .updateTable("Class")
        .set({ image: knownClass.image, id: knownClass.id, pathId })
        .where("name", "=", clazz.name)
        .execute();
    }
  });

  console.timeLog("etl", `Finished updating classes`);
}
