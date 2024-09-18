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
  Text,
} from "@chakra-ui/react";
import { type Ascension, type Player, Lifestyle, Path } from "@prisma/client";
import { useLoaderData, Link as RemixLink, json } from "@remix-run/react";
import { SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { FormattedDate } from "~/components/FormattedDate";
import { PyriteTable } from "~/components/PyriteTable";
import { db, NS13 } from "~/db.server";

export type RowData = Omit<Ascension, "date"> & {
  date: string;
  player: Player;
  path: Omit<Path, "start" | "end"> & {
    start: string | null;
    end: string | null;
  };
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
  const pyrites = await db.tag.findMany({
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

  type PyriteAscension = (typeof pyrites)[number]["ascension"][];

  const [hardcore, softcore] = pyrites.reduce<
    [hardcore: PyriteAscension, softcore: PyriteAscension]
  >(
    (acc, { ascension }) => {
      switch (ascension.lifestyle) {
        case "HARDCORE":
          acc[0].push(ascension);
          break;
        case "SOFTCORE":
          acc[1].push(ascension);
          break;
      }
      return acc;
    },
    [[], []],
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

  return json({ hardcore, softcore, tortoisecore });
};

export default function Pyrites() {
  const { hardcore, softcore, tortoisecore } = useLoaderData<typeof loader>();
  const [sorting, setSorting] = useState<SortingState>([]);

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
      <Text textAlign="center">This page is a work in progress.</Text>
      <Stack
        fontSize="smaller"
        spacing={4}
        direction={["column", null, null, "row"]}
        alignItems="stretch"
        justifyContent="center"
      >
        <Card>
          <CardHeader>
            <Heading size="md">Hardcore</Heading>
          </CardHeader>
          <CardBody>
            <PyriteTable
              ascensions={hardcore}
              sorting={sorting}
              setSorting={setSorting}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Softcore</Heading>
          </CardHeader>
          <CardBody>
            <PyriteTable
              ascensions={softcore}
              sorting={sorting}
              setSorting={setSorting}
            />
          </CardBody>
        </Card>
      </Stack>
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
