import { Container, Heading, Table } from "@chakra-ui/react";

import { AscensionDate } from "~/components/AscensionDate";
import { Class } from "~/components/Class";
import { PlayerLink } from "~/components/PlayerLink";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { Turncount } from "~/components/Turncount";
import type { LeaderboardEntry } from "~/db.server";
import {
  awardBg,
  formatExtraValue,
  getExtra,
  getExtraEntries,
  numberFormatter,
} from "~/utils";

type Props = {
  title?: string;
  ascensions: LeaderboardEntry[];
  showClass?: boolean;
  ranked?: boolean;
  alternativeScore?: [title: string, key: string];
  omitExtra?: string;
  children?: React.ReactNode;
};

export function Leaderboard({
  title,
  ascensions,
  showClass = true,
  ranked = true,
  alternativeScore,
  omitExtra,
  children,
}: Props) {
  const omit = [alternativeScore?.[1], omitExtra].filter((k) => k !== undefined);
  const entries = ascensions.map((asc) => getExtraEntries(asc.extra, omit));
  const keys = [...new Set(entries.flat().map(([key]) => key))];
  const extras = entries.map((e) =>
    keys.length === 1
      ? e.map(([, value]) => formatExtraValue(value)).join(", ")
      : e.map(([key, value]) => `${key}: ${formatExtraValue(value)}`).join(", "),
  );

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
              {ranked && <Table.ColumnHeader>#</Table.ColumnHeader>}
              <Table.ColumnHeader>Player</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              {alternativeScore && (
                <Table.ColumnHeader>{alternativeScore[0]}</Table.ColumnHeader>
              )}
              {keys.length > 0 && (
                <Table.ColumnHeader>
                  {keys.length === 1 ? keys[0] : "Extra"}
                </Table.ColumnHeader>
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
                bg={ranked ? awardBg(i + 1) : undefined}
              >
                {ranked && <Table.Cell>{i + 1}</Table.Cell>}
                <Table.Cell>
                  <PlayerLink player={asc.player} />
                </Table.Cell>
                <Table.Cell>
                  <AscensionDate ascension={asc} />
                </Table.Cell>
                {alternativeScore && (
                  <Table.Cell>
                    {numberFormatter.format(getExtra(alternativeScore[1])(asc))}
                  </Table.Cell>
                )}
                {keys.length > 0 && <Table.Cell>{extras[i]}</Table.Cell>}
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
      {children}
    </Container>
  );
}
