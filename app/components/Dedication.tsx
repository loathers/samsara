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
import { Link as RemixLink } from "@remix-run/react";
import { DedicationEntry } from "~/db.server";
import { awardBg } from "~/utils";

type Props = {
  title?: string;
  dedication: DedicationEntry[];
};

export function Dedication({ title, dedication }: Props) {
  return (
    <TableContainer flex={1}>
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
            <Th>№</Th>
          </Tr>
        </Thead>
        <Tbody>
          {dedication.map((p, i) => (
            <Tr key={p.id} bg={awardBg(i + 1)}>
              <Td>{i + 1}</Td>
              <Td>
                <Link as={RemixLink} to={`/player/${p.id}`}>
                  {p.name} (#{p.id})
                </Link>
              </Td>
              <Td>{p.runs}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
