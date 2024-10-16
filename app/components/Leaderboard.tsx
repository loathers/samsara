import {
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { LeaderboardEntry } from "~/db.server";
import { Class } from "./Class";
import { awardBg, formatTurncount, numberFormatter } from "~/utils";
import { ResponsiveContent } from "./ResponsiveContent";
import { PlayerLink } from "./PlayerLink";
import { AscensionDate } from "./AscensionDate";

type JsonifiedLeaderboardEntry = Omit<LeaderboardEntry, "date"> & {
  date: string;
};

type Props = {
  title?: string;
  ascensions: JsonifiedLeaderboardEntry[];
  showClass?: boolean;
  alternativeScore?: [
    title: string,
    renderer: (ascension: JsonifiedLeaderboardEntry) => number,
  ];
};

export function Leaderboard({
  title,
  ascensions,
  showClass = true,
  alternativeScore,
}: Props) {
  return (
    <TableContainer>
      {title && (
        <Heading textAlign="center" as="h3" size="sm">
          {title}
        </Heading>
      )}
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Player</Th>
            <Th>Date</Th>
            {alternativeScore && <Th>{alternativeScore[0]}</Th>}
            <Th>
              <ResponsiveContent narrow="D / T" wide="Days / Turns" />
            </Th>
            <Th>
              <ResponsiveContent narrow="Lvl" wide="Level" />
            </Th>
            {showClass && <Th>Class</Th>}
            <Th>Sign</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ascensions.map((a, i) => (
            <Tr key={`${a.player.id}/${a.ascensionNumber}`} bg={awardBg(i + 1)}>
              <Td>{i + 1}</Td>
              <Td>
                <PlayerLink player={a.player} />
              </Td>
              <Td>
                <AscensionDate ascension={a} />
              </Td>
              {alternativeScore && (
                <Td>{numberFormatter.format(alternativeScore[1](a))}</Td>
              )}
              <Td>{formatTurncount(a.days, a.turns)}</Td>
              <Td>{a.level}</Td>
              {showClass && (
                <Td>
                  <Class class={a.class} shorten="acronyms" />
                </Td>
              )}
              <Td>{a.sign}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
