import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";

type Props = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
};

export function LeaderboardAccordionItem({
  title,
  description,
  children,
}: Props) {
  switch (description) {
    case "{PYRITE}":
      description =
        "A hypothetical leaderboard for all-time; invented, respected, and dominated by fools.";
      break;
  }

  return (
    <AccordionItem>
      <AccordionButton>
        <HStack flex={1}>
          <Heading size="md">{title}</Heading> <Text>{description}</Text>
        </HStack>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <Stack
          spacing={4}
          direction={["column", null, null, "row"]}
          alignItems="start"
        >
          {children}
        </Stack>
      </AccordionPanel>
    </AccordionItem>
  );
}
