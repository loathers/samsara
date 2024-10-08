import {
  Text,
  Stack,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Select,
  Button,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
} from "@chakra-ui/react";
import { json, Link, useLoaderData, useNavigate } from "@remix-run/react";

import { FrequencyGraph } from "../components/FrequencyGraph.js";
import { Counter } from "../components/Counter.js";
import { db } from "~/db.server";
import { PopularityGraph } from "~/components/PopularityGraph";
import { PathLink } from "~/components/PathLink";
import { CoolStat } from "~/components/CoolStat";
import { FormEventHandler, useCallback } from "react";
import { formatPathName, getPathAcronym } from "~/components/Path";
import { HeadersFunction } from "@remix-run/node";

export const meta = () => {
  return [
    { title: "Saṃsāra" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export const loader = async () => {
  const totalTracked = await db.ascension.count();

  const frequency = await db.ascension.getFrequency();
  const popularity = await db.ascension.getPopularity();

  // If we could add raw SQL, `ORDER BY id = 999, id DESC, name ASC` would do this
  const paths = (
    await db.path.findMany({
      orderBy: [{ id: { nulls: "last", sort: "desc" } }, { name: "asc" }],
    })
  ).sort((a, b) => (a.id === 999 ? 1 : b.id === 999 ? -1 : 0));

  // This works because the list of paths is ordered such that the most recent seasonal is first.
  const currentPath =
    paths[0].end && paths[0].end > new Date()
      ? paths[0]
      : { name: "Standard", slug: "standard", image: "standard11" };

  const [currentPathers, currentPathersChange] = await db.ascension.getStat({
    path: currentPath,
  });
  const [loopers, loopersChange] = await db.ascension.getStat({
    numberOfAscensions: 7,
  });

  const rollover = new Date();
  rollover.setUTCHours(24 + 3, 30, 0, 0);
  const secondsToRollover = Math.ceil((rollover.getTime() - Date.now()) / 1000);

  return json(
    {
      paths,
      loopers,
      loopersChange,
      currentPath,
      currentPathers,
      currentPathersChange,
      frequency,
      totalTracked,
      popularity,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${secondsToRollover + 60 * 60}`,
      },
    },
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export default function Index() {
  const {
    paths,
    loopers,
    loopersChange,
    currentPath,
    currentPathers,
    currentPathersChange,
    frequency,
    totalTracked,
    popularity,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  const goToPath = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      const slug = (
        event.currentTarget.elements.namedItem(
          "slug",
        ) as HTMLSelectElement | null
      )?.value;
      if (!slug) return;
      navigate(`/path/${slug}`);
      return;
    },
    [navigate],
  );

  const goToPlayer = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      const player = (
        event.currentTarget.elements.namedItem(
          "player",
        ) as HTMLInputElement | null
      )?.value;
      if (!player) return;
      navigate(`/player/${player}`);
      return;
    },
    [navigate],
  );

  return (
    <Stack spacing={12} alignItems="stretch">
      <Stack spacing={8} alignItems="center">
        <Link to="/">
          <Heading alignSelf="center">
            <Stack direction="row">
              <Text>Saṃsāra</Text>
              <Image height="1lh" src="/gash.webp" />
            </Stack>
          </Heading>
        </Link>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
      </Stack>
      <Stack direction={["column", null, "row"]} justifyContent="space-around">
        <Card>
          <CardHeader>
            <Heading size="md">Browse by path</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={goToPath}>
              <InputGroup>
                <Select name="slug" borderRightRadius={0}>
                  {paths.map((path) => (
                    <option key={path.name} value={path.slug}>
                      {formatPathName(path)}
                    </option>
                  ))}
                </Select>
                <InputRightAddon>
                  <Button type="submit">Go</Button>
                </InputRightAddon>
              </InputGroup>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Browse by player</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={goToPlayer}>
              <InputGroup>
                <Input
                  name="player"
                  type="text"
                  placeholder="Player name or id"
                />
                <InputRightAddon>
                  <Button type="submit">Go</Button>
                </InputRightAddon>
              </InputGroup>
            </form>
          </CardBody>
        </Card>
      </Stack>
      <Card height={400}>
        <CardHeader>
          <Heading size="md">Top 10 paths in the last week</Heading>
        </CardHeader>
        <CardBody>
          <PopularityGraph data={popularity} />
        </CardBody>
      </Card>
      <Card height={200}>
        <CardHeader>
          <Heading size="md">All time ascension frequency</Heading>
        </CardHeader>
        <CardBody>
          <FrequencyGraph
            data={frequency}
            lines={paths
              .filter((p) => p.start && p.name !== "Standard")
              .map((p) => ({
                time: new Date(p.start!).getTime(),
                label: getPathAcronym(p.name),
              }))}
          />
        </CardBody>
      </Card>
      <Stack direction={["column", "row"]} justifyContent="space-around">
        <CoolStat current={currentPathers} change={currentPathersChange}>
          Accounts that ascended <PathLink path={currentPath} /> this week
        </CoolStat>
        <CoolStat current={loopers} change={loopersChange}>
          Accounts that ascended every day in the last week
        </CoolStat>
        <Card>
          <CardBody>
            <Button as={Link} to="/pyrites">
              Pyrite Plugs
            </Button>
          </CardBody>
        </Card>
      </Stack>
    </Stack>
  );
}
