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
import { Pagination } from "./Pagination";
import { HStack, Table, Container, Text } from "@chakra-ui/react";
import { PlayerTableHeader } from "./PlayerTableHeader";
import { FormattedDate } from "./FormattedDate";
import { ResponsiveContent } from "./ResponsiveContent";
import { Class } from "./Class";
import { RowData } from "~/routes/player.$id";
import { PathLink } from "./PathLink";
import { formatLifestyle } from "./Lifestyle";
import { formatTurncount } from "~/utils";
import { TagMedal } from "./TagMedal";
import { useEffect, useRef, useState } from "react";

declare module "@tanstack/react-table" {
  // @ts-expect-error This should work but TS is wrong here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TableData extends RowData, TValue> {
    hide: true;
  }
}

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
  columnHelper.group({
    header: "Path",
    columns: [
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
      columnHelper.accessor("lifestyle", {
        cell: () => null,
        getUniqueValues: (a) => [formatLifestyle(a.lifestyle)],
        meta: {
          hide: true,
        },
      }),
    ],
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
      <HStack>
        <Text>{formatTurncount(info.getValue(), info.row.original.turns)}</Text>
        {info.row.original.tags.map((t) => (
          <TagMedal key={t.type} tag={t} path={info.row.original.path} />
        ))}
      </HStack>
    ),
    sortingFn: (a, b) => {
      const dayComp = a.original.days - b.original.days;
      return dayComp !== 0 ? dayComp : a.original.turns - b.original.turns;
    },
    enableColumnFilter: false,
  }),
];

type Props = {
  ascensions: RowData[];
  jumpTo?: number;
};

export function PlayerTable({ ascensions, jumpTo }: Props) {
  const pageSize = 50;
  const pageIndex = jumpTo ? Math.floor((jumpTo - 1) / pageSize) : 0;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex,
    pageSize,
  });

  const hasScrolledToAscension = useRef(false);
  useEffect(() => {
    if (
      hasScrolledToAscension.current ||
      !jumpTo ||
      pagination.pageIndex !== pageIndex
    )
      return;
    document.getElementById(`${jumpTo}`)?.scrollIntoView();
    hasScrolledToAscension.current = true;
  }, [pageIndex, pagination, jumpTo]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: ascensions,
    getRowId: (row) => `${row.ascensionNumber}`,
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

  const headerGroups = table.getHeaderGroups();
  const headerGroup = headerGroups[headerGroups.length - 1];

  return (
    <>
      <Pagination table={table} value={pagination} onChange={setPagination} />
      <Container>
        <Table.Root>
          <Table.Header>
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <PlayerTableHeader key={header.id} header={header} />
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row) => {
              const abandoned = row.original.abandoned;
              const cells = row.getVisibleCells();
              const selected = row.original.ascensionNumber === jumpTo;
              return (
                <Table.Row
                  id={row.id}
                  key={row.id}
                  bg={selected ? "yellow.50" : undefined}
                  scrollMarginTop={20}
                >
                  {cells
                    .slice(0, abandoned ? 2 : cells.length)
                    .map(
                      (cell) =>
                        !cell.column.columnDef.meta?.hide && (
                          <Table.Cell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Table.Cell>
                        ),
                    )}
                  {abandoned && (
                    <Table.Cell
                      colSpan={cells.length - 2}
                      fontSize="sm"
                      color="grey"
                    >
                      Run abandoned
                    </Table.Cell>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Container>
      <Pagination table={table} value={pagination} onChange={setPagination} />
    </>
  );
}
