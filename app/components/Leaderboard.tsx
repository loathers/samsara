import { Container, Heading, Table } from "@chakra-ui/react";

import { AscensionDate } from "~/components/AscensionDate";
import { Class } from "~/components/Class";
import { PlayerLink } from "~/components/PlayerLink";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { Turncount } from "~/components/Turncount";
import { LeaderboardEntry } from "~/db.server";
import { awardBg, numberFormatter } from "~/utils";

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
      <Table.ScrollArea>
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
            {ascensions.map((asc, i) => (
              <Table.Row
                key={`${asc.player.id}/${asc.ascensionNumber}`}
                bg={awardBg(i + 1)}
              >
                <Table.Cell>{i + 1}</Table.Cell>
                <Table.Cell>
                  <PlayerLink player={asc.player} />
                </Table.Cell>
                <Table.Cell>
                  <AscensionDate ascension={asc} />
                </Table.Cell>
                {alternativeScore && (
                  <Table.Cell>
                    {numberFormatter.format(alternativeScore[1](asc))}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <Turncount days={asc.days} turns={asc.turns} />
                </Table.Cell>
                <Table.Cell>{asc.level}</Table.Cell>
                {showClass && (
                  <Table.Cell>
                    <Class class={asc.class} shorten="acronyms" />
                  </Table.Cell>
                )}
                <Table.Cell>{asc.sign}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Container>
  );
}
