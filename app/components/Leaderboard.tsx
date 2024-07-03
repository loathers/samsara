import {
  Heading,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { FormattedDate } from "./FormattedDate";
import { Link as RemixLink } from "@remix-run/react";
import { LeaderboardEntry } from "~/db.server";
import { Class } from "./Class";

type Props = {
  title?: string;
  ascensions: LeaderboardEntry[];
  showClass?: boolean;
  alternativeScore?: [
    title: string,
    renderer: (ascension: LeaderboardEntry) => React.ReactNode,
  ];
};

function awardBg(rank: number) {
  if (rank === 1) return "#fad25a";
  if (rank < 12) return "silver";
  return "transparent";
}

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
              <Text display={["none", null, null, "block"]}>Days / Turns</Text>
              <Text display={["block", null, null, "none"]}>D / T</Text>
            </Th>
            <Th>
              <Text display={["none", null, null, "block"]}>Level</Text>
              <Text display={["block", null, null, "none"]}>Lvl</Text>
            </Th>
            {showClass && <Th>Class</Th>}
            <Th>Sign</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ascensions.map((a, i) => (
            <Tr key={`${a.playerId}/${a.ascensionNumber}`} bg={awardBg(i + 1)}>
              <Td>{i + 1}</Td>
              <Td>
                <Link as={RemixLink} to={`/player/${a.player.id}`}>
                  {a.player.name} (#{a.player.id})
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
