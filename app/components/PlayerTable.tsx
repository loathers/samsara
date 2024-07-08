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
import {
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { PlayerTableHeader } from "./PlayerTableHeader";
import { FormattedDate } from "./FormattedDate";
import { ResponsiveContent } from "./ResponsiveContent";
import { Class } from "./Class";
import { RowData } from "~/routes/player.$id";
import { PathLink } from "./PathLink";
import { formatLifestyle } from "./Lifestyle";
import { formatTurncount } from "~/utils";
import { TagMedal } from "./TagMedal";
import { useState } from "react";

declare module "@tanstack/react-table" {
  // @ts-expect-error This should work but TS is wrong here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
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
          <TagMedal key={t.type} tag={t} />
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
};

export function PlayerTable({ ascensions }: Props) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns,
    data: ascensions,
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
      <TableContainer>
        <Table>
          <Thead>
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <PlayerTableHeader key={header.id} header={header} />
              ))}
            </Tr>
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
                  {row
                    .getVisibleCells()
                    .map(
                      (cell) =>
                        !cell.column.columnDef.meta?.hide && (
                          <Td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Td>
                        ),
                    )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
      <Pagination table={table} value={pagination} onChange={setPagination} />
    </>
  );
}
