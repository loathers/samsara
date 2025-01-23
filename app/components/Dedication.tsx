import { Container, Heading, Table } from "@chakra-ui/react";

import { PlayerLink } from "~/components/PlayerLink";
import { DedicationEntry } from "~/db.server";
import { awardBg, numberFormatter } from "~/utils";

type Props = {
  title?: string;
  dedication: DedicationEntry[];
};

export function Dedication({ title, dedication }: Props) {
  return (
    <Container flex={1}>
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
              <Table.ColumnHeader>№</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {dedication.map((p, i) => (
              <Table.Row key={p.id} bg={awardBg(i + 1, [1, 1, 1])}>
                <Table.Cell>{i + 1}</Table.Cell>
                <Table.Cell>
                  <PlayerLink player={p} />
                </Table.Cell>
                <Table.Cell>{numberFormatter.format(p.runs)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Container>
  );
}
