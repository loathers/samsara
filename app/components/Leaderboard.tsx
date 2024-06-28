import {
  Heading,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { Ascension, Player } from "@prisma/client";
import { ShowDate } from "./ShowDate";
import { Link as RemixLink } from "@remix-run/react";

type Props = {
  title: string;
  ascensions: (Player & Ascension)[];
};

function awardBg(rank: number) {
  if (rank === 1) return "#fad25a";
  if (rank < 12) return "silver";
  return "transparent";
}

export function Leaderboard({ title, ascensions }: Props) {
  return (
    <TableContainer>
      <Heading textAlign="center" as="h3" size="sm">
        {title}
      </Heading>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Player</Th>
            <Th>Date</Th>
            <Th>Days / Turns</Th>
            <Th>Level</Th>
            <Th>Class</Th>
            <Th>Sign</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ascensions.map((a, i) => (
            <Tr key={`${a.playerId}/${a.ascensionNumber}`} bg={awardBg(i + 1)}>
              <Td>{i + 1}</Td>
              <Td>
                <Link as={RemixLink} to={`/player/${a.playerId}`}>
                  {a.name} (#{a.playerId})
                </Link>
              </Td>
              <Td>
                <ShowDate date={a.date} />
              </Td>
              <Td>
                {a.days} / {a.turns}
              </Td>
              <Td>{a.level}</Td>
              <Td>{a.class}</Td>
              <Td>{a.sign}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
