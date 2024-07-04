import { Button, ButtonGroup, Flex, Input, Text } from "@chakra-ui/react";
import { Table } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

type Props<T> = {
  table: Table<T>;
};

export function Pagination<T>({ table }: Props<T>) {
  const count = table.getPageCount();

  const [currentPage, setCurrentPage] = useState(
    table.getState().pagination.pageIndex,
  );
  const correctValue = useMemo(
    () => (currentPage + 1).toString(),
    [currentPage],
  );

  const [inputValue, setInputValue] = useState(correctValue);
  useEffect(() => {
    table.setPageIndex(currentPage);
    setInputValue(correctValue);
  }, [currentPage, correctValue, table]);

  return (
    <Flex justifyContent="space-between">
      <ButtonGroup isAttached>
        <Button
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => setCurrentPage(0)}
          title="First Page"
        >
          {"<<"}
        </Button>
        <Button
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => setCurrentPage((c) => c - 1)}
          title="Previous Page"
        >
          {"<"}
        </Button>
      </ButtonGroup>
      <Text>
        Page{" "}
        <Input
          padding={2}
          type="number"
          title="Current page"
          width="3em"
          textAlign="center"
          value={inputValue}
          min={1}
          max={count}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setInputValue(value);
            if (!e.currentTarget.validity.valid) return;
            if (!value) return;
            const page = Number(value);
            if (Number.isNaN(page)) return;
            table.setPageIndex(page - 1);
            setCurrentPage(page - 1);
          }}
          onBlur={() => setInputValue(correctValue)}
        />{" "}
        of {count}
      </Text>
      <ButtonGroup isAttached>
        <Button
          isDisabled={!table.getCanNextPage()}
          onClick={() => setCurrentPage((c) => c + 1)}
          title="Next Page"
        >
          {">"}
        </Button>
        <Button
          isDisabled={!table.getCanNextPage()}
          onClick={() => setCurrentPage(count - 1)}
          title="Last Page"
        >
          {">>"}
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
