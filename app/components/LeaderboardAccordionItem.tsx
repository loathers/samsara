import { Heading, HStack, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Accordion } from "./Accordion";

type Props = {
  title: string;
  slug?: string;
  description: React.ReactNode;
  children: React.ReactNode;
};

export function LeaderboardAccordionItem({
  title,
  description,
  children,
  slug,
}: Props) {
  switch (description) {
    case "{PYRITE}":
      description =
        "A hypothetical leaderboard for all-time; invented, respected, and dominated by fools";
      break;
  }

  return (
    <Accordion.Item value={slug || title.toLowerCase()}>
      <Accordion.ItemTrigger>
        <HStack flex={1}>
          <Heading size="md">{title}</Heading> <Text>{description}</Text>
        </HStack>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Stack
          gap={4}
          direction={["column", null, null, "row"]}
          alignItems="stretch"
          justifyContent="center"
        >
          {children}
        </Stack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}
