import {
  Button,
  Card,
  Group,
  HStack,
  Heading,
  Link,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  type Ascension,
  Lifestyle as LifestyleEnum,
  Path,
  type Player,
} from "@prisma/client";
import { Link as RRLink, useLoaderData } from "react-router";

import { AscensionDate } from "~/components/AscensionDate";
import { KoLImage } from "~/components/KoLImage";
import { Lifestyle } from "~/components/Lifestyle";
import { PlayerLink } from "~/components/PlayerLink";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { StatsTable } from "~/components/StatsTable";
import { Turncount } from "~/components/Turncount";
import { db } from "~/db.server.js";
import { NS13 } from "~/utils.js";

type AscensionData = Ascension & {
  date: Date;
  player: Player;
  path: Path;
};

export type RowData = {
  path: AscensionData["path"];
  totalRunsInSeason: number;
  totalRuns: number;
  hardcore: AscensionData;
  softcore?: AscensionData;
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Stats` },
    {
      name: "description",
      content: `Stats for each path, including the best runs in history. Also some extra special runs.`,
    },
  ];
};

export const loader = async () => {
  const separatePyrites = (
    await db.tag.findMany({
      include: {
        ascension: {
          include: { player: true, path: true },
        },
      },
      where: {
        type: {
          in: ["PYRITE", "PYRITE_SPECIAL"],
        },
        value: 1,
      },
      orderBy: {
        ascension: {
          path: {
            id: "desc",
          },
        },
      },
    })
  ).filter(
    (a) => a.ascension.path.id !== 999 || a.ascension.lifestyle !== "SOFTCORE",
  );

  type PyriteAscension = (typeof separatePyrites)[number];
  type PathPyrites = {
    path: PyriteAscension["ascension"]["path"];
    totalRuns: number;
    totalRunsInSeason: number;
    hardcore: PyriteAscension["ascension"];
    softcore?: PyriteAscension["ascension"];
  };

  const totalRunsPerPath = Object.fromEntries(
    (
      await db.ascension.groupBy({
        by: ["pathName"],
        _count: true,
      })
    ).map(({ pathName, _count }) => [pathName, _count]),
  );

  const totalRunsInSeasonPerPath = Object.fromEntries(
    (
      await db.$queryRaw<{ pathName: string; _count: number }[]>`
    SELECT
      COUNT(*)::int as "_count",
      "Ascension"."pathName"
    FROM
      "Ascension"
    INNER JOIN 
      "Path"
    ON
      "Ascension"."pathName" = "Path"."name"
    WHERE
      "Ascension"."date" <= "Path"."end"
    GROUP BY "Ascension"."pathName"
  `
    ).map(({ pathName, _count }) => [pathName, _count]),
  );

  const paths = Object.values(
    separatePyrites.reduce<Record<string, PathPyrites>>(
      (acc, tag) => ({
        ...acc,
        [tag.ascension.path.name]: {
          ...acc[tag.ascension.path.name],
          path: tag.ascension.path,
          totalRuns: totalRunsPerPath[tag.ascension.path.name] ?? 0,
          totalRunsInSeason:
            totalRunsInSeasonPerPath[tag.ascension.path.name] ?? 0,
          // If we have no ascension for this path/lifestyle, then use this one. Or overwrite if we have a PYRITE_SPECIAL as those are the true pyrites
          ...(!acc[tag.ascension.lifestyle.toLowerCase()] ||
          tag.type === "PYRITE_SPECIAL"
            ? { [tag.ascension.lifestyle.toLowerCase()]: tag.ascension }
            : {}),
        },
      }),
      {},
    ),
  );

  // Count up all the pyrite holders for the ultimate leaderboard of fools
  const leaderboard = [
    ...separatePyrites
      .reduce<Map<Player, number>>((acc, p) => {
        const key =
          [...acc.keys()].find((k) => k.id === p.ascension.player.id) ??
          p.ascension.player;
        const count = acc.get(key) ?? 0;
        acc.set(key, count + 1);
        return acc;
      }, new Map())
      .entries(),
  ]
    .map(([player, count]) => ({ player, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const tortoisecore = (
    await Promise.all(
      [
        LifestyleEnum.CASUAL,
        LifestyleEnum.SOFTCORE,
        LifestyleEnum.HARDCORE,
      ].map((l) =>
        db.ascension.findFirst({
          where: {
            pathName: "None",
            abandoned: false,
            dropped: false,
            date: { gt: NS13 },
            lifestyle: l,
          },
          orderBy: [{ turns: "asc" }, { days: "asc" }],
          select: {
            player: true,
            days: true,
            turns: true,
            playerId: true,
            ascensionNumber: true,
            lifestyle: true,
            date: true,
          },
          take: 1,
        }),
      ),
    )
  ).filter((t) => t !== null);

  const longest = (
    await Promise.all(
      ["turns" as const, "days" as const].flatMap((u) =>
        [LifestyleEnum.SOFTCORE, LifestyleEnum.HARDCORE].flatMap((l) =>
          db.ascension.findFirst({
            where: {
              lifestyle: l,
              abandoned: false,
              dropped: false,
              date: { gt: NS13 },
            },
            orderBy: [{ [u]: "desc" }],
            select: {
              player: true,
              days: true,
              turns: true,
              playerId: true,
              ascensionNumber: true,
              lifestyle: true,
              date: true,
            },
            take: 1,
          }),
        ),
      ),
    )
  ).filter((r) => r !== null);

  return { leaderboard, paths, tortoisecore, longest };
};

export default function Stats() {
  const { leaderboard, paths, tortoisecore, longest } =
    useLoaderData<typeof loader>();

  return (
    <Stack gap={10} alignItems="center">
      <Stack gap={4}>
        <Heading alignSelf="center" size="4xl">
          Stats
        </Heading>
        <Group justifyContent="center">
          <Button asChild>
            <RRLink to="/">home</RRLink>
          </Button>
        </Group>
      </Stack>
      <StatsTable paths={paths} />
      <Card.Root width={["100%", null, "80%"]}>
        <Card.Header>
          <Heading size="md">Leaderboard of Fools</Heading>
        </Card.Header>
        <Card.Body gap={4}>
          <Text>
            Within the Kingdom of Loathing, <b>pyrites</b> are runs that are
            notable for being the best in history for their respective paths,
            even if they were completed long after the path was in season. This
            includes the best softcore and hardcore runs for each path, as well
            as some extra special runs. Outside of the Kingdom of Loathing,
            pyrite is{" "}
            <Link href="https://en.wikipedia.org/wiki/Pyrite">fool's gold</Link>
            .
          </Text>
          <Table.ScrollArea>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Player</Table.ColumnHeader>
                  <Table.ColumnHeader align="right">Pyrites</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {leaderboard.map(({ player, count }, i) => (
                  <Table.Row key={player.id}>
                    <Table.Cell>
                      <HStack>
                        <PlayerLink player={player} />
                        {i === 0 && (
                          <KoLImage
                            src={`itemimages/foolscap.gif`}
                            alt="King of Fools"
                          />
                        )}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell align="right">{count}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Card.Body>
      </Card.Root>
      <Card.Root width={["100%", null, "80%"]}>
        <Card.Header>
          <Heading size="md">Tortoisecore</Heading>
        </Card.Header>
        <Card.Body gap={4}>
          <Text>
            Here, Samsara keeps track of the lowest turncount runs for each
            lifestyle, regardless of daycount.
          </Text>
          <Table.ScrollArea>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Lifestyle</Table.ColumnHeader>
                  <Table.ColumnHeader>
                    <ResponsiveContent narrow="D / T" wide="Days / Turns" />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Player</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tortoisecore.map((asc) => (
                  <Table.Row key={`${asc.playerId}${asc.ascensionNumber}`}>
                    <Table.Cell>
                      <Lifestyle
                        lifestyle={asc.lifestyle}
                        shorten="full-symbols"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Turncount days={asc.days} turns={asc.turns} />
                    </Table.Cell>
                    <Table.Cell>
                      <AscensionDate ascension={asc} />
                    </Table.Cell>
                    <Table.Cell>
                      <PlayerLink player={asc.player} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Card.Body>
      </Card.Root>
      <Card.Root width={["100%", null, "80%"]}>
        <Card.Header>
          <Heading size="md">Longest Runs</Heading>
        </Card.Header>
        <Card.Body gap={4}>
          <Text>
            And finally, we track the longest runs by days and turns separately.
            Remember, a run doesn't truly have a length until it's over.
          </Text>
          <Table.ScrollArea>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader></Table.ColumnHeader>
                  <Table.ColumnHeader>Lifestyle</Table.ColumnHeader>
                  <Table.ColumnHeader>
                    <ResponsiveContent narrow="D / T" wide="Days / Turns" />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Player</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {longest.map((asc, i) => (
                  <Table.Row key={`${asc.playerId}${asc.ascensionNumber}`}>
                    {i % 2 === 0 && (
                      <Table.Cell rowSpan={2}>
                        {i < 2 ? "Turns" : "Days"}
                      </Table.Cell>
                    )}
                    <Table.Cell>
                      <Lifestyle
                        lifestyle={asc.lifestyle}
                        shorten="full-symbols"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Turncount days={asc.days} turns={asc.turns} />
                    </Table.Cell>
                    <Table.Cell>
                      <AscensionDate ascension={asc} />
                    </Table.Cell>
                    <Table.Cell>
                      <PlayerLink player={asc.player} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
