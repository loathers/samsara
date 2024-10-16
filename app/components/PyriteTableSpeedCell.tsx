import { HStack, Text } from "@chakra-ui/react";
import { CellContext } from "@tanstack/react-table";
import { RowData } from "~/routes/pyrites";
import {
  compareDaycount,
  formatTurncount,
  getExtra,
  numberFormatter,
} from "~/utils";

type Props = {
  info: CellContext<RowData, number>;
  type: "softcore" | "hardcore";
};

export function SpeedCell({ info, type }: Props) {
  if (!info.row.original[type]) return null;

  const [value, slow] = getData(info, type);

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

function getExtraData(
  info: CellContext<RowData, number>,
  type: "softcore" | "hardcore",
  key: string,
): [value: string | number, slow: boolean] {
  console.log(info.row.original[type]!.extra, key);
  const getter = getExtra(key);
  const value = getter(info.row.original[type]!);
  return [
    numberFormatter.format(value),
    type === "softcore" && value < getter(info.row.original["hardcore"]!),
  ];
}

function getData(
  info: CellContext<RowData, number>,
  type: "softcore" | "hardcore",
): [value: string | number, slow: boolean] {
  switch (info.row.original.path.name) {
    case "Grey Goo":
      return getExtraData(info, type, "Goo Score");
    case "One Crazy Random Summer":
      return getExtraData(info, type, "Fun");
    default:
      return [
        formatTurncount(info.getValue(), info.row.original[type]!.turns),
        type === "softcore" &&
          compareDaycount(
            info.row.original[type],
            info.row.original.hardcore,
          ) >= 0,
      ];
  }
}
