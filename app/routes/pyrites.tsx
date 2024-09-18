import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Heading,
  List,
  ListItem,
  Stack,
} from "@chakra-ui/react";
import { type Ascension, type Player, Lifestyle, Path } from "@prisma/client";
import { useLoaderData, Link as RemixLink, json } from "@remix-run/react";
import { FormattedDate } from "~/components/FormattedDate";
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
  softcore: JsonAscension;
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
  const separatePyrites = await db.tag.findMany({
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
          name: "asc",
        },
      },
    },
  });

  type PyriteAscension = (typeof separatePyrites)[number]["ascension"];
  type PathPyrites = {
    path: PyriteAscension["path"];
    hardcore: PyriteAscension;
    softcore: PyriteAscension;
  };

  const pyrites = Object.values(
    separatePyrites.reduce<Record<string, PathPyrites>>(
      (acc, { ascension }) => ({
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

  return json({ pyrites, tortoisecore });
};

export default function Pyrites() {
  const { pyrites, tortoisecore } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Heading alignSelf="center">Pyrites</Heading>
        <ButtonGroup justifyContent="center">
          <Button as={RemixLink} to="/">
            home
          </Button>
        </ButtonGroup>
      </Stack>
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
                <FormattedDate date={asc.date} />) <b>{asc.player.name}</b>
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>
    </Stack>
  );
}
