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

function FacetedSelect<RowData>({
  column,
  onChange,
}: {
  column: Column<RowData>;
  onChange: () => void;
}) {
  const uniqueValues = column.getFacetedUniqueValues();
  const columnFilterValue = column.getFilterValue();
  const sortedUniqueValues = useMemo(
    () => Array.from(uniqueValues.keys()).sort(),
    [uniqueValues],
  );

  return (
    <Select
      value={columnFilterValue?.toString() ?? ""}
      onChange={(e) => {
        column.setFilterValue(e.target.value);
        onChange();
      }}
    >
      <option value="">Select a {column.id}</option>
      {sortedUniqueValues.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </Select>
  );
}

export function TableFilter<RowData>({ column }: { column: Column<RowData> }) {
  const extraColumns =
    column.parent?.columns.filter((c) => c.id !== column.id) ?? [];

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
                <FacetedSelect column={column} onChange={onClose} />
                {extraColumns.map((c) => (
                  <FacetedSelect key={c.id} column={c} onChange={onClose} />
                ))}
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
