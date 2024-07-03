import { Checkbox, Stack } from "@chakra-ui/react";
import { SetStateAction } from "react";

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
    <Stack spacing={2} direction={"row"} justifyContent="center">
      {payload!.map((entry) => (
        <Checkbox
          size="sm"
          key={entry.value as string}
          type="checkbox"
          defaultChecked={value[entry.value]}
          onChange={(e) =>
            onChange((v) => ({ ...v, [entry.value]: e.target.checked }))
          }
        >
          {formatLabel(entry.value)}
        </Checkbox>
      ))}
    </Stack>
  );
}
