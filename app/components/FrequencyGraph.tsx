import { useBreakpointValue, useToken } from "@chakra-ui/react";
import { useMemo } from "react";
import {
  LabelProps,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Text,
  XAxis,
  YAxis,
} from "recharts";
import { CartesianViewBox } from "recharts/types/util/types";

import { ClientOnly } from "~/components/ClientOnly";
import { calculateRange, compactNumberFormatter, formatTick } from "~/utils";

type Datum = { date: Date; count: number };
type Props = {
  data: Datum[];
  untilNow?: boolean;
  lines?: { time: number; label?: string }[];
};

function LineLabel({
  value,
  viewBox: { x, y } = {},
  xOffset = 2,
  yOffset = 0,
  color,
}: Omit<LabelProps, "viewBox"> & {
  viewBox?: CartesianViewBox;
  xOffset?: number;
  yOffset?: number;
}) {
  return (
    <Text
      x={xOffset + (x ?? 0)}
      y={yOffset + (y ?? 0)}
      offset={yOffset}
      fill={color}
      fontSize={8}
      angle={90}
    >
      {value}
    </Text>
  );
}

export function FrequencyGraph({ data, lines = [], untilNow }: Props) {
  const dateData = useMemo(
    () => data.map((d) => ({ ...d, date: new Date(d.date) })),
    [data],
  );
  const [referenceLine, referenceText] = useToken("colors", [
    "gray.300",
    "gray.500",
  ]);
  const maxReferenceLines = useBreakpointValue({
    base: 0,
    sm: 20,
    md: Infinity,
  })!;
  const range = calculateRange(dateData);
  return (
    <ClientOnly>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dateData}
          title="Ascensions over time"
          margin={{ top: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            dataKey={(d: Datum) => d.date.getTime()}
            tick={{ fontSize: 8 }}
            tickFormatter={(ts: number) => formatTick(ts, range)}
            domain={["dataMin", untilNow ? Date.now() : "dataMax"]}
          />
          <YAxis
            tick={{ fontSize: 8 }}
            domain={[0, "auto"]}
            tickFormatter={(num: number) => compactNumberFormatter.format(num)}
            width={25}
          />
          <Line type="monotone" dataKey="count" dot={false} activeDot={false} />
          {lines.length < maxReferenceLines &&
            lines.map((l) => (
              <ReferenceLine
                key={l.time}
                x={l.time}
                stroke={referenceLine}
                label={<LineLabel value={l.label} color={referenceText} />}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
