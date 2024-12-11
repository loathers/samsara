import { Button, createListCollection, Link, Stack } from "@chakra-ui/react";
import { Column } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { FilterIcon } from "./FilterIcon";
import { Popover } from "./Popover";
import { Select } from "./Select";

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
    () =>
      createListCollection({ items: Array.from(uniqueValues.keys()).sort() }),
    [uniqueValues],
  );

  return (
    <Select.Root
      collection={sortedUniqueValues}
      defaultValue={[columnFilterValue?.toString() ?? ""]}
      onValueChange={({ value }) => {
        column.setFilterValue(value);
        onChange();
      }}
    >
      <Select.Trigger>
        <Select.ValueText placeholder={`Select a ${column.id}`} />
      </Select.Trigger>
      <Select.Content>
        {sortedUniqueValues.items.map((value) => (
          <Select.Item key={value} item={value}>
            {value}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

export function TableFilter<RowData>({ column }: { column: Column<RowData> }) {
  const extraColumns =
    column.parent?.columns.filter((c) => c.id !== column.id) ?? [];

  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={({ open }) => setOpen(open)}>
      <Popover.Trigger>
        <Link title="Apply filter">
          <FilterIcon cursor="pointer" />
        </Link>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.CloseTrigger />
        <Popover.Header>Filter {column.id}</Popover.Header>
        <Popover.Body>
          <Stack>
            <FacetedSelect column={column} onChange={() => setOpen(false)} />
            {extraColumns.map((c) => (
              <FacetedSelect
                key={c.id}
                column={c}
                onChange={() => setOpen(false)}
              />
            ))}
            <Button
              onClick={() => {
                column.setFilterValue(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </Stack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
