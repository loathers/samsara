import { HStack, Table } from "@chakra-ui/react";
import {
  PaginationState,
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";

import { FamiliarIcon } from "./FamiliarIcon";
import { Class } from "~/components/Class";
import { FormattedDate } from "~/components/FormattedDate";
import { formatLifestyle } from "~/components/Lifestyle";
import { Pagination } from "~/components/Pagination";
import { PathLink } from "~/components/PathLink";
import { PlayerTableHeader } from "~/components/PlayerTableHeader";
import { ResponsiveContent } from "~/components/ResponsiveContent";
import { TagMedal } from "~/components/TagMedal";
import { Turncount } from "~/components/Turncount";
import { RowData } from "~/routes/player.$id";

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
        <Turncount days={info.getValue()} turns={info.row.original.turns} />
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
  columnHelper.accessor("familiarPercentage", {
    header: "Familiar",
    cell: (info) => {
      const familiarPercentage = info.getValue();
      const familiar = info.row.original.familiar;

      return (
        <HStack>
          <FamiliarIcon familiar={familiar} />
          {familiarPercentage > 0 && (
            <span style={{ fontSize: "0.8em" }}>
              {` (${familiarPercentage}%)`}
            </span>
          )}
        </HStack>
      );
    },
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
      <Table.ScrollArea>
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
                  bg={selected ? { base: "yellow.50", _dark: "yellow.900" }  : undefined}
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
      </Table.ScrollArea>
      <Pagination table={table} value={pagination} onChange={setPagination} />
    </>
  );
}
