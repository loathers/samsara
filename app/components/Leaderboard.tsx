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
import { FormattedDate } from "./FormattedDate";
import { Link as RemixLink } from "@remix-run/react";

type Props = {
  title: string;
  ascensions: (Player & Ascension)[];
  alternativeScore?: [
    title: string,
    renderer: (ascension: Player & Ascension) => React.ReactNode,
  ];
};

function awardBg(rank: number) {
  if (rank === 1) return "#fad25a";
  if (rank < 12) return "silver";
  return "transparent";
}

export function Leaderboard({ title, ascensions, alternativeScore }: Props) {
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
            {alternativeScore && <Th>{alternativeScore[0]}</Th>}
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
                <FormattedDate date={a.date} />
              </Td>
              {alternativeScore && <Td>{alternativeScore[1](a)}</Td>}
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
