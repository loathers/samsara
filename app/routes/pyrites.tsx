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
import {
  type Ascension,
  type Tag,
  type Player,
  Lifestyle,
} from "@prisma/client";
import { useLoaderData, Link as RemixLink, json } from "@remix-run/react";
import { FormattedDate } from "~/components/FormattedDate";
import { db, NS13 } from "~/db.server";

type Row = Ascension & Tag & Player;

export const loader = async () => {
  const pyrites = await db.$queryRaw<Row[]>`
    SELECT *
      FROM "Tag"
      INNER JOIN "Ascension" ON "Tag"."ascensionNumber" = "Ascension"."ascensionNumber" AND "Tag"."playerId" = "Ascension"."playerId"
      INNER JOIN "Player" ON "Ascension"."playerId" = "Player"."id"
      WHERE "type" IN ('PYRITE','PYRITE_SPECIAL') AND "value" = 1
      ORDER BY "Ascension"."pathName" ASC`;

  const [hardcore, softcore] = pyrites.reduce(
    (acc, asc) => {
      switch (asc.lifestyle) {
        case "HARDCORE":
          acc[0].push(asc);
          break;
        case "SOFTCORE":
          acc[1].push(asc);
          break;
      }
      return acc;
    },
    [[], []] as [hardcore: Row[], softcore: Row[]],
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
            <List>
              {hardcore.map((asc) => (
                <ListItem key={`${asc.playerId}${asc.ascensionNumber}`}>
                  {asc.pathName} {asc.lifestyle} {asc.days}/{asc.turns} (
                  <FormattedDate date={asc.date} />) <b>{asc.name}</b>
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Softcore</Heading>
          </CardHeader>
          <CardBody>
            <List>
              {softcore.map((asc) => (
                <ListItem key={`${asc.playerId}${asc.ascensionNumber}`}>
                  {asc.pathName} {asc.lifestyle} {asc.days}/{asc.turns} (
                  <FormattedDate date={asc.date} />) <b>{asc.name}</b>
                </ListItem>
              ))}
            </List>
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
