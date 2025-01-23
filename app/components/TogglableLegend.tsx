import { Stack } from "@chakra-ui/react";
import { SetStateAction } from "react";

import { Checkbox } from "~/components/Checkbox";

type Props<T extends Record<string, boolean>> = {
  value: T;
  onChange: React.Dispatch<SetStateAction<T>>;
  payload?: { value: keyof T }[];
  formatLabel: (label: keyof T) => string;
};

export function TogglableLegend<T extends Record<string, boolean>>(
  props: Props<T>,
) {
  const {
    value,
    onChange,
    payload,
    formatLabel = (label) => label.toString(),
  } = props;
  return (
    <Stack gap={2} direction={"row"} justifyContent="center">
      {payload!.map((entry) => (
        <Checkbox
          size="sm"
          key={entry.value as string}
          defaultChecked={value[entry.value]}
          onCheckedChange={({ checked }) =>
            onChange((v) => ({ ...v, [entry.value]: checked }))
          }
        >
          {formatLabel(entry.value)}
        </Checkbox>
      ))}
    </Stack>
  );
}
