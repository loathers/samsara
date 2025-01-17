import { HStack, Text } from "@chakra-ui/react";
import { CellContext } from "@tanstack/react-table";
import { useMemo } from "react";
import { RowData } from "~/routes/stats";
import {
  compareDaycount,
  formatTurncount,
  getExtra,
  numberFormatter,
  SPECIAL_RANKINGS,
} from "~/utils";

type Props = {
  info: CellContext<RowData, number>;
  type: "softcore" | "hardcore";
};

export function SpeedCell({ info, type }: Props) {
  const data = info.row.original[type];
  if (!data) return null;

  const [value, slow] = useMemo<[value: string | number, slow: boolean]>(() => {
    const special = SPECIAL_RANKINGS.get(info.row.original.path.name);

    if (special) {
      const getter = getExtra(special);
      const value = getter(data);
      return [
        numberFormatter.format(value),
        type === "softcore" && value < getter(info.row.original.hardcore),
      ];
    }

    return [
      formatTurncount(info.getValue(), data.turns),
      type === "softcore" &&
        compareDaycount(data, info.row.original.hardcore) >= 0,
    ];
  }, [data, type]);

  return (
    <HStack>
      <Text>{value}</Text>
      {slow && (
        <Text
          title="Slower than or equal to the hardcore equivalent"
          cursor="help"
        >
          🧊
        </Text>
      )}
    </HStack>
  );
}
