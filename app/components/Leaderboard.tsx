import { Container, Heading, Table } from "@chakra-ui/react";

import { type Board, visibleExtras } from "~/boards";
import { AscensionDate } from "~/components/AscensionDate";
import { Class } from "~/components/Class";
import { ExtraInfo } from "~/components/ExtraInfo";
import { PlayerLink } from "~/components/PlayerLink";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { Turncount } from "~/components/Turncount";
import type { LeaderboardEntry } from "~/db.server";
import {
  awardBg,
  formatExtraEntries,
  formatExtraKey,
  formatExtraValue,
  getExtra,
  numberFormatter,
  splitExtras,
} from "~/utils";

type Props = {
  title?: string;
  ascensions: LeaderboardEntry[];
  showClass?: boolean;
  ranked?: boolean;
  pathName: string;
  /** The board's measure, shown in its own column ahead of the daycount. */
  alternativeScore?: Board["extra"];
  omitExtra?: string;
  children?: React.ReactNode;
};

export function Leaderboard({
  title,
  ascensions,
  showClass = true,
  ranked = true,
  pathName,
  alternativeScore,
  omitExtra,
  children,
}: Props) {
  const omit = [alternativeScore?.key, omitExtra].filter((k) => k !== undefined);
  const visible = visibleExtras(pathName);
  const split = ascensions.map((asc) => splitExtras(asc.extra, visible, omit));
  const keys = [
    ...new Set(split.flatMap(({ shown }) => shown).map(([key]) => key)),
  ];
  const extras = split.map(({ shown }) =>
    keys.length === 1
      ? shown.map(([, value]) => formatExtraValue(value)).join(", ")
      : formatExtraEntries(shown),
  );
  const showInfo = split.some(({ hidden }) => hidden.length > 0);

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
                <Table.ColumnHeader>{alternativeScore.label}</Table.ColumnHeader>
              )}
              {keys.length > 0 && (
                <Table.ColumnHeader>
                  {keys.length === 1 ? formatExtraKey(keys[0]) : "Extra"}
                </Table.ColumnHeader>
              )}
              {showInfo && <Table.ColumnHeader />}
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
                    {numberFormatter.format(getExtra(alternativeScore.key)(asc))}
                  </Table.Cell>
                )}
                {keys.length > 0 && <Table.Cell>{extras[i]}</Table.Cell>}
                {showInfo && (
                  <Table.Cell>
                    {split[i].hidden.length > 0 && (
                      <ExtraInfo entries={split[i].hidden} />
                    )}
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
      {children}
    </Container>
  );
}
