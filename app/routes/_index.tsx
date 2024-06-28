import { Text, Stack, Heading, Box } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { AscensionsGraph } from "~/components/AscensionsGraph";
import { Counter } from "~/components/Counter";
import { db } from "~/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Saṃsāra ♻️" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export const loader = async () => {
  const totalTracked = await db.ascension.count();

  const stats = await db.ascension.getStats();

  return json({ stats, totalTracked });
};

export default function Index() {
  const { stats, totalTracked } = useLoaderData<typeof loader>();
  return (
    <Stack spacing={10} alignItems="center">
      <Stack spacing={6} alignItems="center">
        <Heading alignSelf="center">
          <Link to="/">Saṃsāra ♻️</Link>
        </Heading>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
      </Stack>
      <Box height={150} width="50%">
        <AscensionsGraph data={stats} />
      </Box>
    </Stack>
  );
}
