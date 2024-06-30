import {
  Heading,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { LoaderFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "../db.server.js";

import { FormattedDate } from "../components/FormattedDate.js";
import { Path as PathType } from "@prisma/client";
import { PathLink } from "../components/PathLink.js";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;

  if (!id || isNaN(parseInt(id)))
    throw json({ message: "Invalid player ID" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parseInt(id) },
    include: {
      ascensions: {
        orderBy: { ascensionNumber: "asc" },
      },
    },
  });

  const paths = (await db.path.findMany({})).reduce(
    (acc, path) => ({ ...acc, [path.name]: path }),
    {} as Record<string, PathType>,
  );

  if (!player) throw json({ message: "Player not found" }, { status: 404 });

  return json({ player, paths });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Saṃsāra ♻️ - ${data?.player.name}` },
    { name: "description", content: "Kingdom of Loathing ascension database" },
  ];
};

export default function Player() {
  const { player, paths } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <Heading alignSelf="center">{player.name}</Heading>
      <Table>
        <Thead>
          <Tr>
            <Th>#</Th>
            <Th>Date</Th>
            <Th>Level</Th>
            <Th>Path</Th>
            <Th>Class</Th>
            <Th>Sign</Th>
            <Th>Days / Turns</Th>
          </Tr>
        </Thead>
        <Tbody>
          {player.ascensions.map((ascension) => {
            if (ascension.abandoned)
              return (
                <Tr key={ascension.ascensionNumber}>
                  <Td>{ascension.ascensionNumber}</Td>
                  <Td>
                    <FormattedDate date={ascension.date} />
                  </Td>
                  <Td colSpan={5} fontSize="sm" color="grey">
                    Run abandoned
                  </Td>
                </Tr>
              );
            return (
              <Tr key={ascension.ascensionNumber}>
                <Td>{ascension.ascensionNumber}</Td>
                <Td>
                  <FormattedDate date={ascension.date} />
                </Td>
                <Td>{ascension.level}</Td>
                <Td>
                  <PathLink
                    ascension={ascension}
                    path={paths[ascension.pathName]}
                  />
                </Td>
                <Td>{ascension.class}</Td>
                <Td>{ascension.sign}</Td>
                <Td>
                  {ascension.days} / {ascension.turns}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Stack>
  );
}
