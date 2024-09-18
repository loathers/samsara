import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { FormattedDate } from "./FormattedDate";
import { ResponsiveContent } from "./ResponsiveContent";
import { RowData } from "~/routes/pyrites";
import { PathLink } from "./PathLink";
import { formatTurncount } from "~/utils";
import React from "react";
import { PlayerLink } from "./PlayerLink";

declare module "@tanstack/react-table" {
  // @ts-expect-error This should work but TS is wrong here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    hide: true;
  }
}

const columnHelper = createColumnHelper<RowData>();

const columns = [
  columnHelper.accessor("path", {
    header: "Path",
    cell: (info) => <PathLink path={info.getValue()} shorten="full-symbols" />,
    sortingFn: (a, b) =>
      a.original.path.name.localeCompare(b.original.path.name),
  }),
  columnHelper.accessor("days", {
    header: () => <ResponsiveContent narrow="D / T" wide="Days / Turns" />,
    cell: (info) => (
      <Text>{formatTurncount(info.getValue(), info.row.original.turns)}</Text>
    ),
    sortingFn: (a, b) => {
      const dayComp = a.original.days - b.original.days;
      return dayComp !== 0 ? dayComp : a.original.turns - b.original.turns;
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => <FormattedDate date={info.getValue()} />,
  }),
  columnHelper.display({
    header: "",
    id: "in-season",
    cell: (info) =>
      info.row.original.path.end &&
      new Date(info.row.original.date) <
        new Date(info.row.original.path.end) ? (
        <span title="In-Season">🌱</span>
      ) : null,
  }),
  columnHelper.accessor("player", {
    header: "Player",
    cell: (info) => <PlayerLink player={info.getValue()} />,
    sortingFn: (a, b) =>
      a.original.player.name.localeCompare(b.original.player.name),
  }),
];

type Props = {
  ascensions: RowData[];
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
};

export function PyriteTable({ ascensions, sorting, setSorting }: Props) {
  const table = useReactTable({
    columns,
    data: ascensions,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <TableContainer>
      <Table>
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th key={header.id}>
                  {header.isPlaceholder ? null : (
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
                    </Text>
                  )}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row) => (
            <Tr key={row.id}>
              {row.getVisibleCells().map(
                (cell) =>
                  !cell.column.columnDef.meta?.hide && (
                    <Td px={4} key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Td>
                  ),
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
