import {
  Button,
  Flex,
  Group,
  HStack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { PaginationState, Table } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useMemo } from "react";

import { Select } from "~/components/Select";

type Props<T> = {
  table: Table<T>;
  value: PaginationState;
  onChange: Dispatch<SetStateAction<PaginationState>>;
};

export function Pagination<T>({ table, value, onChange }: Props<T>) {
  const count = table.getPageCount();

  const options = useMemo(
    () =>
      createListCollection({
        items: [...Array(count).keys()],
        itemToString: (item) => (item + 1).toString(),
        itemToValue: (item) => item.toString(),
      }),
    [count],
  );

  return (
    <Flex justifyContent="space-between">
      <Group attached>
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => onChange((v) => ({ ...v, pageIndex: 0 }))}
          title="First Page"
        >
          {"<<"}
        </Button>
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() =>
            onChange((v) => ({ ...v, pageIndex: v.pageIndex - 1 }))
          }
          title="Previous Page"
        >
          {"<"}
        </Button>
      </Group>
      <HStack>
        <Text>Page</Text>
        <Select.Root
          collection={options}
          title="Current page"
          textAlign="center"
          value={[value.pageIndex.toString()]}
          onValueChange={({ value: newValue }) => {
            onChange((v) => ({ ...v, pageIndex: Number(newValue[0]) }));
          }}
          width="auto"
          minWidth={Math.ceil(Math.log10(options.items.length)) + 5 + "ch"}
        >
          <Select.Trigger>
            <Select.ValueText />
          </Select.Trigger>
          <Select.Content>
            {options.items.map((item) => (
              <Select.Item item={item} key={options.getItemValue(item)}>
                {options.stringifyItem(item)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>{" "}
        <Text>of {count}</Text>
      </HStack>
      <Group attached>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() =>
            onChange((v) => ({ ...v, pageIndex: v.pageIndex + 1 }))
          }
          title="Next Page"
        >
          {">"}
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => onChange((v) => ({ ...v, pageIndex: count - 1 }))}
          title="Last Page"
        >
          {">>"}
        </Button>
      </Group>
    </Flex>
  );
}
