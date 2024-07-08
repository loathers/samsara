import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from "@chakra-ui/icons";
import { HStack, Link, Th, Text } from "@chakra-ui/react";
import { flexRender, Header } from "@tanstack/react-table";
import { RowData } from "~/routes/player.$id";
import { TableFilter } from "./TableFilter";

type Props = {
  header: Header<RowData, unknown>;
};

export function PlayerTableHeader({ header }: Props) {
  if (header.column.columnDef.meta?.hide) return null;
  const columns = header.column.parent?.columns ?? [header.column];
  return (
    <Th>
      <HStack>
        {columns.some((c) => c.getIsFiltered()) ? (
          <>
            {columns
              .map((c) => c.getFilterValue()?.toString())
              .filter((c) => c !== undefined)
              .join(", ")}{" "}
            <Link
              title="Clear"
              onClick={() => {
                columns.forEach((c) => c.setFilterValue(undefined));
              }}
            >
              <CloseIcon p="2px" />
            </Link>
          </>
        ) : (
          <Text
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
            {flexRender(header.column.columnDef.header, header.getContext())}
          </Text>
        )}
        {header.column.getCanFilter() && <TableFilter column={header.column} />}
        {!header.column.getIsFiltered() &&
          ({
            asc: <ArrowUpIcon />,
            desc: <ArrowDownIcon />,
          }[header.column.getIsSorted() as string] ??
            null)}
      </HStack>
    </Th>
  );
}
