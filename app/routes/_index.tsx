import { Text, Stack, Heading } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
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
  return json({ totalTracked });
};

export default function Index() {
  const { totalTracked } = useLoaderData<typeof loader>();
  return (
    <Stack spacing={10}>
      <Stack spacing={6}>
        <Heading alignSelf="center">
          <Link to="/">Saṃsāra ♻️</Link>
        </Heading>

        <Stack direction="row" justifyContent="center" alignItems="center">
          <Text>Now tracking</Text>
          <Counter value={totalTracked} duration={1} lineHeight={25} />
          <Text>incarnations!</Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
