import {
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Select,
  Text,
} from "@chakra-ui/react";
import { PaginationState, Table } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useMemo } from "react";

type Props<T> = {
  table: Table<T>;
  value: PaginationState;
  onChange: Dispatch<SetStateAction<PaginationState>>;
};

export function Pagination<T>({ table, value, onChange }: Props<T>) {
  const count = table.getPageCount();

  const options = useMemo(
    () =>
      [...Array(count).keys()].map((i) => (
        <option key={i} value={i}>
          {i + 1}
        </option>
      )),
    [count],
  );

  return (
    <Flex justifyContent="space-between">
      <ButtonGroup isAttached>
        <Button
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => onChange((v) => ({ ...v, pageIndex: 0 }))}
          title="First Page"
        >
          {"<<"}
        </Button>
        <Button
          isDisabled={!table.getCanPreviousPage()}
          onClick={() =>
            onChange((v) => ({ ...v, pageIndex: v.pageIndex - 1 }))
          }
          title="Previous Page"
        >
          {"<"}
        </Button>
      </ButtonGroup>
      <HStack>
        <Text>Page</Text>
        <Select
          title="Current page"
          textAlign="center"
          value={value.pageIndex}
          onChange={(e) => {
            onChange((v) => ({ ...v, pageIndex: Number(e.target.value) }));
          }}
          width="auto"
        >
          {options}
        </Select>{" "}
        <Text>of {count}</Text>
      </HStack>
      <ButtonGroup isAttached>
        <Button
          isDisabled={!table.getCanNextPage()}
          onClick={() =>
            onChange((v) => ({ ...v, pageIndex: v.pageIndex + 1 }))
          }
          title="Next Page"
        >
          {">"}
        </Button>
        <Button
          isDisabled={!table.getCanNextPage()}
          onClick={() => onChange((v) => ({ ...v, pageIndex: count - 1 }))}
          title="Last Page"
        >
          {">>"}
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
