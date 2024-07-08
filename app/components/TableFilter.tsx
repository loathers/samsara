import {
  Button,
  Link,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Stack,
} from "@chakra-ui/react";
import { Column } from "@tanstack/react-table";
import { useMemo } from "react";
import { FilterIcon } from "./FilterIcon";

export function TableFilter<RowData>({ column }: { column: Column<RowData> }) {
  const uniqueValues = column.getFacetedUniqueValues();
  const columnFilterValue = column.getFilterValue();
  const sortedUniqueValues = useMemo(
    () => Array.from(uniqueValues.keys()).sort(),
    [uniqueValues],
  );
  return (
    <Popover>
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <Link title="Apply filter">
              <FilterIcon cursor="pointer" />
            </Link>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverCloseButton />
            <PopoverHeader>Filter {column.id}</PopoverHeader>
            <PopoverBody>
              <Stack>
                <Select
                  value={columnFilterValue?.toString() ?? ""}
                  onChange={(e) => {
                    column.setFilterValue(e.target.value);
                    onClose();
                  }}
                >
                  <option value="">Select a {column.id}</option>
                  {sortedUniqueValues.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={() => {
                    column.setFilterValue(undefined);
                    onClose();
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
}
