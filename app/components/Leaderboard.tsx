import { Heading, Table, Container } from "@chakra-ui/react";
import { LeaderboardEntry } from "~/db.server";
import { Class } from "./Class";
import { awardBg, formatTurncount, numberFormatter } from "~/utils";
import { ResponsiveContent } from "./ResponsiveContent";
import { PlayerLink } from "./PlayerLink";
import { AscensionDate } from "./AscensionDate";

type Props = {
  title?: string;
  ascensions: LeaderboardEntry[];
  showClass?: boolean;
  alternativeScore?: [
    title: string,
    renderer: (ascension: LeaderboardEntry) => number,
  ];
};

export function Leaderboard({
  title,
  ascensions,
  showClass = true,
  alternativeScore,
}: Props) {
  return (
    <Container>
      {title && (
        <Heading textAlign="center" as="h3" size="sm">
          {title}
        </Heading>
      )}
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>#</Table.ColumnHeader>
            <Table.ColumnHeader>Player</Table.ColumnHeader>
            <Table.ColumnHeader>Date</Table.ColumnHeader>
            {alternativeScore && (
              <Table.ColumnHeader>{alternativeScore[0]}</Table.ColumnHeader>
            )}
            <Table.ColumnHeader>
              <ResponsiveContent narrow="D / T" wide="Days / Turns" />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <ResponsiveContent narrow="Lvl" wide="Level" />
            </Table.ColumnHeader>
            {showClass && <Table.ColumnHeader>Class</Table.ColumnHeader>}
            <Table.ColumnHeader>Sign</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ascensions.map((a, i) => (
            <Table.Row
              key={`${a.player.id}/${a.ascensionNumber}`}
              bg={awardBg(i + 1)}
            >
              <Table.Cell>{i + 1}</Table.Cell>
              <Table.Cell>
                <PlayerLink player={a.player} />
              </Table.Cell>
              <Table.Cell>
                <AscensionDate ascension={a} />
              </Table.Cell>
              {alternativeScore && (
                <Table.Cell>
                  {numberFormatter.format(alternativeScore[1](a))}
                </Table.Cell>
              )}
              <Table.Cell>{formatTurncount(a.days, a.turns)}</Table.Cell>
              <Table.Cell>{a.level}</Table.Cell>
              {showClass && (
                <Table.Cell>
                  <Class class={a.class} shorten="acronyms" />
                </Table.Cell>
              )}
              <Table.Cell>{a.sign}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}
