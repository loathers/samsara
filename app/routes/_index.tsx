import { Text, Stack, Heading } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { FrequencyGraph } from "../components/FrequencyGraph.js";
import { Counter } from "../components/Counter.js";
import { db } from "~/db.server";
import { PopularityGraph } from "~/components/PopularityGraph";

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
    SELECT COUNT(*)::integer AS "loopers"
    FROM
      (SELECT
        FROM "Player"
        LEFT JOIN "Ascension" ON "Player"."id" = "Ascension"."playerId"
        WHERE "Ascension"."date" > '2024-06-23'
        GROUP BY "Player"."id"
        HAVING COUNT("Ascension"."ascensionNumber") >= 7)
  `;

  return json({ loopers, frequency, totalTracked, popularity });
};

export default function Index() {
  const { frequency, totalTracked, popularity } =
    useLoaderData<typeof loader>();
  return (
    <Stack spacing={12} alignItems="center">
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
      <Stack spacing={8} height={300} width="50%" alignItems="center">
        <Heading size="md">Top 10 paths in the last week</Heading>
        <PopularityGraph data={popularity} />
      </Stack>
      <Stack spacing={8} height={150} width="50%" alignItems="center">
        <Heading size="md">All time ascension frequency</Heading>
        <FrequencyGraph data={frequency} />
      </Stack>
    </Stack>
  );
}
