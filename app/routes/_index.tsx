import {
  Text,
  Stack,
  Heading,
  Card,
  CardHeader,
  CardBody,
  HStack,
} from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { FrequencyGraph } from "../components/FrequencyGraph.js";
import { Counter } from "../components/Counter.js";
import { db } from "~/db.server";
import { PopularityGraph } from "~/components/PopularityGraph";
import { PathLink } from "~/components/PathLink";
import { CoolStat } from "~/components/CoolStat";

export const meta: MetaFunction = () => {
  return [
    { title: "Saṃsāra ♻️" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export const loader = async () => {
  const totalTracked = await db.ascension.count();

  const frequency = await db.ascension.getStats();
  const popularity = await db.ascension.getPopularity();

  const [{ loopers }] = await db.$queryRaw<[{ loopers: number }]>`
    SELECT COUNT(*)::integer AS "loopers" FROM (
      SELECT
        "name"
	    FROM "Player"
	    LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
	    WHERE
		    "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
		    "Ascension"."date" < DATE_TRUNC('day', NOW())
	    GROUP BY "Player"."id"
	    HAVING COUNT("Ascension"."playerId") >= 7)
  `;

  const [{ loopersPrev }] = await db.$queryRaw<[{ loopersPrev: number }]>`
    SELECT COUNT(*)::integer AS "loopersPrev" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
      GROUP BY "Player"."id"
      HAVING COUNT("Ascension"."playerId") >= 7)
    `;

  const loopersChange = loopers / loopersPrev - 1;

  const currentPath = (await db.path.findFirst({
    where: { start: { lt: new Date() }, end: { gte: new Date() } },
  })) ?? { name: "Standard", slug: "standard" };

  const [{ currentPathers }] = await db.$queryRaw<[{ currentPathers: number }]>`
    SELECT COUNT(*)::integer AS "currentPathers" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."pathName" = ${currentPath.name} AND
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '1 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW())
      GROUP BY "Player"."id")
  `;

  const [{ currentPathersPrev }] = await db.$queryRaw<
    [{ currentPathersPrev: number }]
  >`
    SELECT COUNT(*)::integer AS "currentPathersPrev" FROM (
      SELECT
        "name"
      FROM "Player"
      LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
      WHERE
        "Ascension"."pathName" = ${currentPath.name} AND
        "Ascension"."date" >= DATE_TRUNC('day', NOW() - interval '2 week') AND
        "Ascension"."date" < DATE_TRUNC('day', NOW() - interval '1 week')
      GROUP BY "Player"."id")
    `;

  const currentPathersChange = currentPathers / currentPathersPrev - 1;

  return json({
    loopers,
    loopersChange,
    currentPath,
    currentPathers,
    currentPathersChange,
    frequency,
    totalTracked,
    popularity,
  });
};

export default function Index() {
  const {
    loopers,
    loopersChange,
    currentPath,
    currentPathers,
    currentPathersChange,
    frequency,
    totalTracked,
    popularity,
  } = useLoaderData<typeof loader>();
  return (
    <Stack spacing={12} alignItems="stretch">
      <Stack spacing={8} alignItems="center">
        <Heading alignSelf="center">
          <Link to="/">Saṃsāra ♻️</Link>
        </Heading>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
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
          <FrequencyGraph data={frequency} />
        </CardBody>
      </Card>
      <HStack justifyContent="space-around">
        <CoolStat current={currentPathers} change={currentPathersChange}>
          Accounts that ascended <PathLink path={currentPath} /> this week
        </CoolStat>
        <CoolStat current={loopers} change={loopersChange}>
          Accounts that ascended every day in the last week
        </CoolStat>
      </HStack>
    </Stack>
  );
}
