import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Heading,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  AccordionIcon,
  Box,
} from "@chakra-ui/react";
import { Ascension } from "@prisma/client";
import { formatTurncount } from "~/utils";

type Props = {
  stats: Record<
    string,
    {
      runs: number;
      best: [softcore: Ascension | null, hardcore: Ascension | null];
    }
  >;
};

export function PlayerStats({ stats }: Props) {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        <Heading size="md" as="h3">
          <AccordionButton>
            <Box as="span" flex={1} textAlign="left">
              Statistics
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </Heading>
        <AccordionPanel>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Path</Th>
                <Th>Best (Softcore)</Th>
                <Th>Best (Hardcore)</Th>
                <Th isNumeric>Runs</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(stats)
                .toSorted((a, b) => a[0].localeCompare(b[0]))
                .map(([path, stats]) => (
                  <Tr key={path}>
                    <Td>{path}</Td>
                    <Td>
                      {stats.best[0] &&
                        formatTurncount(
                          stats.best[0].days,
                          stats.best[0].turns,
                        )}
                    </Td>
                    <Td>
                      {stats.best[1] &&
                        formatTurncount(
                          stats.best[1].days,
                          stats.best[1].turns,
                        )}
                    </Td>
                    <Td isNumeric>{stats.runs}</Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
