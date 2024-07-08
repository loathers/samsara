import {
  Heading,
  Stack,
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
  HStack,
  Table,
  Link,
} from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import {
  MetaArgs_SingleFetch,
  redirect,
  useLoaderData,
  Link as RemixLink,
} from "@remix-run/react";

import { db } from "../db.server.js";

import { FormattedDate } from "../components/FormattedDate.js";
import { PathLink } from "../components/PathLink";
import { Class } from "~/components/Class";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Pagination } from "~/components/Pagination";
import { formatTurncount, numberFormatter } from "~/utils.js";
import { FrequencyGraph } from "~/components/FrequencyGraph";
import { TagMedal } from "~/components/TagMedal";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from "@chakra-ui/icons";
import { TableFilter } from "~/components/TableFilter";

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
        include: { path: true, class: true, tags: true },
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

type RowData = Awaited<
  ReturnType<typeof loader>
>["player"]["ascensions"][number];

const columnHelper = createColumnHelper<RowData>();

const columns = [
  columnHelper.accessor("ascensionNumber", {
    header: "#",
    enableColumnFilter: false,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => <FormattedDate date={info.getValue()} />,
    enableColumnFilter: false,
  }),
  columnHelper.accessor("level", {
    header: () => <ResponsiveContent narrow="Lvl" wide="Level" />,
    enableColumnFilter: false,
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
    getUniqueValues: (a) => [a.path.name],
    filterFn: (row, columnId, filterValue) =>
      row.original.path.name === filterValue,
  }),
  columnHelper.accessor("class", {
    header: "Class",
    cell: (info) => <Class class={info.getValue()} shorten="symbols" />,
    sortingFn: (a, b) =>
      a.original.class.name.localeCompare(b.original.class.name),
    getUniqueValues: (a) => [a.class.name],
    filterFn: (row, columnId, filterValue) =>
      row.original.class.name === filterValue,
  }),
  columnHelper.accessor("sign", { header: "Sign" }),
  columnHelper.accessor("days", {
    header: () => <ResponsiveContent narrow="D / T" wide="Days / Turns" />,
    cell: (info) => (
      <Stack direction="row">
        <Text>{formatTurncount(info.getValue(), info.row.original.turns)}</Text>
        {info.row.original.tags.map((t) => (
          <TagMedal key={t.type} tag={t} />
        ))}
      </Stack>
    ),
    sortingFn: (a, b) => {
      const dayComp = a.original.days - b.original.days;
      return dayComp !== 0 ? dayComp : a.original.turns - b.original.turns;
    },
    enableColumnFilter: false,
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
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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
          <Button as={RemixLink} leftIcon={<span>←</span>} to="/">
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
                  <Th key={header.id}>
                    <HStack>
                      {header.column.getIsFiltered() ? (
                        <>
                          {header.column.getFilterValue()?.toString()}{" "}
                          <Link
                            title="Clear"
                            onClick={() =>
                              header.column.setFilterValue(undefined)
                            }
                          >
                            <CloseIcon p="2px" />
                          </Link>
                        </>
                      ) : (
                        <Text
                          onClick={header.column.getToggleSortingHandler()}
                          cursor={
                            header.column.getCanSort() ? "pointer" : "default"
                          }
                          title={
                            header.column.getCanSort()
                              ? {
                                  asc: "Sort ascending",
                                  desc: "Sort descending",
                                  clear: "Clear Sort",
                                }[
                                  header.column.getNextSortingOrder() || "clear"
                                ]
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </Text>
                      )}
                      {header.column.getCanFilter() && (
                        <TableFilter column={header.column} />
                      )}
                      {!header.column.getIsFiltered() &&
                        ({
                          asc: <ArrowUpIcon />,
                          desc: <ArrowDownIcon />,
                        }[header.column.getIsSorted() as string] ??
                          null)}
                    </HStack>
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
