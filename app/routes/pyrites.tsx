import {
  Button,
  Card,
  Container,
  Group,
  Heading,
  HStack,
  Link,
  List,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { type Ascension, type Player, Lifestyle, Path } from "@prisma/client";
import { useLoaderData, Link as RemixLink } from "@remix-run/react";
import { AscensionDate } from "~/components/AscensionDate";
import { KoLImage } from "~/components/KoLImage";
import { PlayerLink } from "~/components/PlayerLink";
import { PyriteTable } from "~/components/PyriteTable";
import { db, NS13 } from "~/db.server";

type AscensionData = Ascension & {
  date: Date;
  player: Player;
  path: Path;
};

export type RowData = {
  path: AscensionData["path"];
  hardcore: AscensionData;
  softcore?: AscensionData;
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Pyrites` },
    {
      name: "description",
      content: `Stats for the best runs in history for each path, as well as some extra special runs.`,
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
    hardcore: PyriteAscension["ascension"];
    softcore?: PyriteAscension["ascension"];
  };

  const pyrites = Object.values(
    separatePyrites.reduce<Record<string, PathPyrites>>(
      (acc, tag) => ({
        ...acc,
        [tag.ascension.path.name]: {
          ...acc[tag.ascension.path.name],
          path: tag.ascension.path,
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

  const tortoiseQueries = [
    Lifestyle.CASUAL,
    Lifestyle.SOFTCORE,
    Lifestyle.HARDCORE,
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
      include: { player: true },
      take: 1,
    }),
  );

  const tortoisecore = (await Promise.all(tortoiseQueries)).filter(
    (t) => t !== null,
  );

  return { leaderboard, pyrites, tortoisecore };
};

export default function Pyrites() {
  const { leaderboard, pyrites, tortoisecore } = useLoaderData<typeof loader>();

  return (
    <Stack gap={10} alignItems="center">
      <Stack gap={4}>
        <Heading alignSelf="center">Pyrites</Heading>
        <Group justifyContent="center">
          <Button asChild>
            <RemixLink to="/">home</RemixLink>
          </Button>
        </Group>
      </Stack>
      <Text>
        Within the Kingdom of Loathing, <b>pyrites</b> are runs that are notable
        for being the best in history for their respective paths, even if they
        were completed long after the path was in season. This includes the best
        softcore and hardcore runs for each path, as well as some extra special
        runs. Outside of the Kingdom of Loathing, pyrite is{" "}
        <Link href="https://en.wikipedia.org/wiki/Pyrite">fool's gold</Link>.
      </Text>
      <Heading as="h3" size="md">
        Leaderboard of Fools
      </Heading>
      <Container width={["100%", null, "50%"]}>
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
      </Container>
      <Heading as="h3" size="md">
        Pyrite Standings
      </Heading>
      <PyriteTable ascensions={pyrites} />
      <Card.Root>
        <Card.Header>
          <Heading size="md">Tortoisecore</Heading>
        </Card.Header>
        <Card.Body>
          <List.Root>
            {tortoisecore.map((asc) => (
              <List.Item key={`${asc.playerId}${asc.ascensionNumber}`}>
                {asc.lifestyle} {asc.days}/{asc.turns} (
                <AscensionDate ascension={asc} />) <b>{asc.player.name}</b>
              </List.Item>
            ))}
          </List.Root>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
