import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { HStack, Table, Text } from "@chakra-ui/react";
import { ResponsiveContent } from "./ResponsiveContent";
import { RowData } from "~/routes/pyrites";
import { PathLink } from "./PathLink";
import { compareDaycount } from "~/utils";
import { useState } from "react";
import { PlayerLink } from "./PlayerLink";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { AscensionDate } from "./AscensionDate";
import { SpeedCell } from "./PyriteTableSpeedCell";

declare module "@tanstack/react-table" {
  // @ts-expect-error This should work but TS is wrong here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TableData extends RowData, TValue> {
    hide: true;
  }
}

const groupColumnsFactory = (type: "softcore" | "hardcore") => [
  columnHelper.accessor(`${type}.days`, {
    header: () => <ResponsiveContent narrow="D / T" wide="Days / Turns" />,
    cell: (info) => <SpeedCell type={type} info={info} />,
    sortingFn: (a, b) => compareDaycount(a.original[type], b.original[type]),
  }),
  columnHelper.accessor(`${type}.date`, {
    header: "Date",
    cell: (info) =>
      info.row.original[type] ? (
        <HStack>
          <AscensionDate ascension={info.row.original[type]} />
          {info.row.original.path.end &&
            new Date(info.row.original[type].date) <=
              new Date(info.row.original.path.end) && (
              <Text title="Achieved while path was in season" cursor="help">
                🌱
              </Text>
            )}
        </HStack>
      ) : null,
  }),
  columnHelper.accessor(`${type}.player`, {
    header: "Player",
    cell: (info) =>
      info.row.original[type] && <PlayerLink player={info.getValue()} />,
    sortingFn: (a, b) => {
      if (!a.original[type]) return -1;
      if (!b.original[type]) return 1;
      return a.original[type].player.name.localeCompare(
        b.original[type].player.name,
      );
    },
  }),
];

const columnHelper = createColumnHelper<RowData>();

const columns = [
  columnHelper.accessor("path", {
    header: "Path",
    cell: (info) => <PathLink path={info.getValue()} shorten="full-symbols" />,
    sortingFn: (a, b) =>
      a.original.path.name.localeCompare(b.original.path.name),
  }),
  columnHelper.group({
    header: "Softcore",
    columns: groupColumnsFactory("softcore"),
  }),
  columnHelper.group({
    header: "Hardcore",
    columns: groupColumnsFactory("hardcore"),
  }),
];

type Props = {
  ascensions: RowData[];
};

export function PyriteTable({ ascensions }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
    <Table.ScrollArea fontSize="smaller">
      <Table.Root>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeader
                  px={4}
                  key={header.id}
                  colSpan={header.colSpan}
                >
                  {header.isPlaceholder ? null : (
                    <HStack>
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
                                clear:
                                  header.column.id === "path"
                                    ? "Path id"
                                    : "Clear Sort",
                              }[header.column.getNextSortingOrder() || "clear"]
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </Text>
                      {{
                        asc: <LuArrowUp />,
                        desc: <LuArrowDown />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </HStack>
                  )}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map(
                (cell) =>
                  !cell.column.columnDef.meta?.hide && (
                    <Table.Cell px={4} key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Table.Cell>
                  ),
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
