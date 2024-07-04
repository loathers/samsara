import {
  Heading,
  Stack,
  Table,
  Text,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  ButtonGroup,
  TableContainer,
  Box,
} from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import {
  Link,
  MetaArgs_SingleFetch,
  redirect,
  useLoaderData,
} from "@remix-run/react";

import { db } from "../db.server.js";

import { FormattedDate } from "../components/FormattedDate.js";
import { PathLink } from "../components/PathLink";
import { Class } from "~/components/Class";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Ascension, Class as ClassType, Path } from "@prisma/client";
import { useState } from "react";
import { Pagination } from "~/components/Pagination";
import { formatTurncount, numberFormatter } from "~/utils.js";
import { FrequencyGraph } from "~/components/FrequencyGraph";

export const loader = defineLoader(async ({ params }) => {
  const { id } = params;

  if (id && isNaN(parseInt(id))) {
    const found = await db.player.findFirst({
      where: { name: { mode: "insensitive", equals: id } },
    });

    if (found) throw redirect(`/player/${found.id}`);
    throw json({ message: "Invalid player name" }, { status: 400 });
  }

  if (!id) throw json({ message: "Invalid player ID" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parseInt(id) },
    include: {
      ascensions: {
        include: { path: true, class: true },
        orderBy: { ascensionNumber: "asc" },
      },
    },
  });

  if (!player) throw json({ message: "Player not found" }, { status: 404 });

  const frequency = await db.ascension.getFrequency({ player });

  return { player, frequency };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: data && `Saṃsāra - ${data.player.name} (#${data.player.id})` },
    {
      name: "description",
      content:
        data &&
        `Ascension stats for ${data.player.name}'s ${numberFormatter.format(data.player.ascensions.length)} runs`,
    },
  ];
};

const columnHelper = createColumnHelper<
  Ascension & { path: Path } & { class: ClassType }
>();

const columns = [
  columnHelper.accessor("ascensionNumber", { header: "#" }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => <FormattedDate date={info.getValue()} />,
  }),
  columnHelper.accessor("level", {
    header: () => (
      <>
        <Text display={["none", null, null, "inline"]}>Level</Text>
        <Text display={["inline", null, null, "none"]}>Lvl</Text>
      </>
    ),
  }),
  columnHelper.accessor("path", {
    header: "Path",
    cell: (info) => (
      <PathLink
        lifestyle={info.row.original.lifestyle}
        path={info.getValue()}
        shorten="symbols"
      />
    ),
    sortingFn: (a, b) =>
      a.original.path.name.localeCompare(b.original.path.name),
  }),
  columnHelper.accessor("class", {
    header: "Class",
    cell: (info) => <Class class={info.getValue()} shorten="symbols" />,
    sortingFn: (a, b) =>
      a.original.class.name.localeCompare(b.original.class.name),
  }),
  columnHelper.accessor("sign", { header: "Sign" }),
  columnHelper.accessor("days", {
    header: () => (
      <>
        <Text display={["none", null, null, "inline"]}>Days / Turns</Text>
        <Text display={["inline", null, null, "none"]}>D / T</Text>
      </>
    ),
    cell: (info) => formatTurncount(info.getValue(), info.row.original.turns),
    sortingFn: (a, b) => {
      const dayComp = a.original.days - b.original.days;
      return dayComp !== 0 ? dayComp : a.original.turns - b.original.turns;
    },
  }),
];

export default function Player() {
  const { player, frequency } = useLoaderData<typeof loader>()!;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: player.ascensions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      pagination,
    },
  });

  return (
    <Stack spacing={10}>
      <Stack spacing={4}>
        <Heading alignSelf="center">
          {player.name} (#{player.id})
        </Heading>
        <ButtonGroup justifyContent="center">
          <Button as={Link} leftIcon={<span>←</span>} to="/">
            home
          </Button>
        </ButtonGroup>
      </Stack>
      <Box
        textAlign="center"
        mt={8}
        height={150}
        width="100%"
        alignSelf="center"
      >
        <FrequencyGraph data={frequency} untilNow />
      </Box>
      <Pagination table={table} value={pagination} onChange={setPagination} />
      <TableContainer>
        <Table>
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    cursor={header.column.getCanSort() ? "pointer" : "default"}
                    title={
                      header.column.getCanSort()
                        ? {
                            asc: "Sort ascending",
                            desc: "Sort descending",
                            clear: "Clear Sort",
                          }[header.column.getNextSortingOrder() || "clear"]
                        : undefined
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.original.abandoned) {
                const cells = row.getVisibleCells();
                return (
                  <Tr key={row.id}>
                    <Td>
                      {flexRender(
                        cells[0].column.columnDef.cell,
                        cells[0].getContext(),
                      )}
                    </Td>
                    <Td>
                      {flexRender(
                        cells[1].column.columnDef.cell,
                        cells[1].getContext(),
                      )}
                    </Td>
                    <Td colSpan={cells.length - 2} fontSize="sm" color="grey">
                      Run abandoned
                    </Td>
                  </Tr>
                );
              }

              return (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Td>
                  ))}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
      <Pagination table={table} value={pagination} onChange={setPagination} />
    </Stack>
  );
}
