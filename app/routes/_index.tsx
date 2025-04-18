import { Counter } from "../components/Counter.js";
import { FrequencyGraph } from "../components/FrequencyGraph.js";
import {
  Button,
  Card,
  Group,
  Heading,
  IconButton,
  Image,
  Input,
  InputAddon,
  SimpleGrid,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { FormEventHandler, useCallback } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import {
  type HeadersFunction,
  Link,
  data,
  useLoaderData,
  useNavigate,
} from "react-router";

import { CoolStat } from "~/components/CoolStat";
import { PathLink } from "~/components/PathLink";
import { PopularityGraph } from "~/components/PopularityGraph";
import { Select } from "~/components/Select.js";
import { db } from "~/db.server";
import { formatPathName, getPathAcronym } from "~/utils.js";

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
    (paths[0]?.end ?? 0) > new Date()
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

  return data(
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

function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
    toggleColorMode,
  };
}

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
  const { toggleColorMode, colorMode } = useColorMode();

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

  const pathCollection = createListCollection({
    items: paths ?? [],
    itemToString: formatPathName,
    itemToValue: (p) => p.slug,
  });

  return (
    <SimpleGrid gap={8} alignItems="stretch">
      <IconButton
        position="absolute"
        top={5}
        right={5}
        onClick={toggleColorMode}
        variant="subtle"
        title={
          colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
      >
        {colorMode === "light" ? <LuSun /> : <LuMoon />}
      </IconButton>
      <Stack gap={8} alignItems="center">
        <Link to="/">
          <Heading size="4xl" alignSelf="center">
            <Stack direction="row">
              <Text>Saṃsāra</Text>
              <Image
                height="1lh"
                src="/gash.webp"
                filter={{ _dark: "invert(1)" }}
              />
            </Stack>
          </Heading>
        </Link>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
      </Stack>
      <SimpleGrid gap={8} columns={[1, null, 2]}>
        <Card.Root>
          <Card.Header>
            <Heading size="md">Browse by path</Heading>
          </Card.Header>
          <Card.Body>
            <form onSubmit={goToPath}>
              <Group attached width="100%">
                <Select.Root
                  name="slug"
                  collection={pathCollection}
                  defaultValue={[pathCollection.items[0]?.slug]}
                >
                  <Select.Trigger borderRightRadius={0}>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.Content>
                    {pathCollection.items.map((path) => (
                      <Select.Item item={path} key={path.slug}>
                        {formatPathName(path)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <InputAddon bg="colorPalette.solid">
                  <Button type="submit">Go</Button>
                </InputAddon>
              </Group>
            </form>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Header>
            <Heading size="md">Browse by player</Heading>
          </Card.Header>
          <Card.Body>
            <form onSubmit={goToPlayer}>
              <Group attached width="100%">
                <Input
                  name="player"
                  type="text"
                  placeholder="Player name or id"
                />
                <InputAddon bg="colorPalette.solid">
                  <Button type="submit">Go</Button>
                </InputAddon>
              </Group>
            </form>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
      <Card.Root height={400}>
        <Card.Header>
          <Heading size="md">Top 10 paths in the last week</Heading>
        </Card.Header>
        <Card.Body>
          <PopularityGraph data={popularity} />
        </Card.Body>
      </Card.Root>
      <Card.Root height={200}>
        <Card.Header>
          <Heading size="md">All time ascension frequency</Heading>
        </Card.Header>
        <Card.Body>
          <FrequencyGraph
            data={frequency}
            lines={(paths ?? [])
              .filter((p) => p.start && p.name !== "Standard")
              .map((p) => ({
                time: new Date(p.start!).getTime(),
                label: getPathAcronym(p.name),
              }))}
          />
        </Card.Body>
      </Card.Root>
      <SimpleGrid gap={8} columns={[1, 3]}>
        <CoolStat current={currentPathers} change={currentPathersChange}>
          Accounts that ascended <PathLink path={currentPath} /> this week
        </CoolStat>
        <CoolStat current={loopers} change={loopersChange}>
          Accounts that ascended every day in the last week
        </CoolStat>
        <Card.Root>
          <Card.Body>
            <Button asChild>
              <Link to="/stats">Stats for Nerds</Link>
            </Button>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </SimpleGrid>
  );
}
