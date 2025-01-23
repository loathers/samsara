import { HStack, Text } from "@chakra-ui/react";
import { CellContext } from "@tanstack/react-table";
import { JSX, useMemo } from "react";

import { Turncount } from "~/components/Turncount";
import { RowData } from "~/routes/stats";
import {
  SPECIAL_RANKINGS,
  compareDaycount,
  getExtra,
  numberFormatter,
} from "~/utils";

type Props = {
  info: CellContext<RowData, number>;
  type: "softcore" | "hardcore";
};

export function SpeedCell({ info, type }: Props) {
  const data = info.row.original[type];
  if (!data) return null;

  const [turncount, slow] = useMemo<[value: JSX.Element, slow: boolean]>(() => {
    const special = SPECIAL_RANKINGS.get(info.row.original.path.name);

    if (special) {
      const getter = getExtra(special);
      const value = getter(data);
      return [
        <Text>{numberFormatter.format(value)}</Text>,
        type === "softcore" && value < getter(info.row.original.hardcore),
      ];
    }

    return [
      <Turncount days={info.getValue()} turns={data.turns} />,
      type === "softcore" &&
        compareDaycount(data, info.row.original.hardcore) >= 0,
    ];
  }, [data, type]);

  return (
    <HStack>
      {turncount}
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
