import { Text, Stack, Heading } from "@chakra-ui/react";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Saṃsāra ♻️" },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export default function Index() {
  return (
    <Stack spacing={10}>
      <Heading alignSelf="center">
        <Link to="/">Saṃsāra ♻️</Link>
      </Heading>
      <Text>Welcome!</Text>
    </Stack>
  );
}
