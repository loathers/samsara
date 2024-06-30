import {
  Text,
  Stack,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
} from "@chakra-ui/react";
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

  return json({ loopers, loopersChange, frequency, totalTracked, popularity });
};

export default function Index() {
  const { frequency, totalTracked, popularity, loopers, loopersChange } =
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
      <Card p={5}>
        <Stat>
          <StatLabel>
            Accounts that ascended every day in the last week
          </StatLabel>
          <StatNumber>{loopers}</StatNumber>
          <StatHelpText>
            {loopersChange === 0 ? (
              "No change"
            ) : (
              <>
                <StatArrow type={loopersChange > 0 ? "increase" : "decrease"} />
                {(Math.abs(loopersChange) * 100).toFixed(1)}% on week before
              </>
            )}
          </StatHelpText>
        </Stat>
      </Card>
    </Stack>
  );
}
