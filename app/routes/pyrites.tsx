import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Link,
  List,
  ListItem,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { type Ascension, type Player, Lifestyle, Path } from "@prisma/client";
import { useLoaderData, Link as RemixLink, json } from "@remix-run/react";
import { AscensionDate } from "~/components/AscensionDate";
import { KoLImage } from "~/components/KoLImage";
import { PlayerLink } from "~/components/PlayerLink";
import { PyriteTable } from "~/components/PyriteTable";
import { db, NS13 } from "~/db.server";

type JsonAscension = Omit<Ascension, "date"> & {
  date: string;
  player: Player;
  path: Omit<Path, "start" | "end"> & {
    start: string | null;
    end: string | null;
  };
};

export type RowData = {
  path: JsonAscension["path"];
  hardcore: JsonAscension;
  softcore?: JsonAscension;
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
  )
    .map((t) => t.ascension)
    .filter((a) => a.path.id !== 999 || a.lifestyle !== "SOFTCORE");

  type PyriteAscension = (typeof separatePyrites)[number];
  type PathPyrites = {
    path: PyriteAscension["path"];
    hardcore: PyriteAscension;
    softcore?: PyriteAscension;
  };

  const pyrites = Object.values(
    separatePyrites.reduce<Record<string, PathPyrites>>(
      (acc, ascension) => ({
        ...acc,
        [ascension.path.name]: {
          ...acc[ascension.path.name],
          path: ascension.path,
          [ascension.lifestyle.toLowerCase()]: ascension,
        },
      }),
      {},
    ),
  );

  const leaderboard = [
    ...separatePyrites
      .reduce<Map<Player, number>>((acc, p) => {
        const key =
          [...acc.keys()].find((k) => k.id === p.player.id) ?? p.player;
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

  return json({ leaderboard, pyrites, tortoisecore });
};

export default function Pyrites() {
  const { leaderboard, pyrites, tortoisecore } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10} alignItems="center">
      <Stack spacing={4}>
        <Heading alignSelf="center">Pyrites</Heading>
        <ButtonGroup justifyContent="center">
          <Button as={RemixLink} to="/">
            home
          </Button>
        </ButtonGroup>
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
      <TableContainer width={["100%", null, "50%"]}>
        <Table>
          <Thead>
            <Tr>
              <Th>Player</Th>
              <Th isNumeric>Pyrites</Th>
            </Tr>
          </Thead>
          <Tbody>
            {leaderboard.map(({ player, count }, i) => (
              <Tr key={player.id}>
                <Td>
                  <HStack>
                    <PlayerLink player={player} />
                    {i === 0 && (
                      <KoLImage
                        src={`itemimages/foolscap.gif`}
                        alt="King of Fools"
                      />
                    )}
                  </HStack>
                </Td>
                <Td isNumeric>{count}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Heading as="h3" size="md">
        Pyrite Standings
      </Heading>
      <PyriteTable ascensions={pyrites} />
      <Card>
        <CardHeader>
          <Heading size="md">Tortoisecore</Heading>
        </CardHeader>
        <CardBody>
          <List>
            {tortoisecore.map((asc) => (
              <ListItem key={`${asc.playerId}${asc.ascensionNumber}`}>
                {asc.lifestyle} {asc.days}/{asc.turns} (
                <AscensionDate ascension={asc} />) <b>{asc.player.name}</b>
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>
    </Stack>
  );
}
