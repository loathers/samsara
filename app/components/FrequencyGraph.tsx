import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatTick, calculateRange } from "~/utils";

type Datum = { date: Date; count: number };
type Props = {
  data: Datum[];
  inSeasonTo?: Date | null;
};

const compactNumber = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function FrequencyGraph({ data, inSeasonTo }: Props) {
  const range = calculateRange(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        title="Progression of best runs over time"
        margin={{ top: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          dataKey={(d: Datum) => d.date.getTime()}
          tick={{ fontSize: 8 }}
          tickFormatter={(ts: number) => formatTick(ts, range)}
          domain={["dataMin", "dataMax"]}
        />
        <YAxis
          tick={{ fontSize: 8 }}
          domain={[0, "auto"]}
          tickFormatter={(num: number) => compactNumber.format(num)}
          width={25}
        />
        <Line type="monotone" dataKey="count" dot={false} />
        {inSeasonTo && <ReferenceLine x={inSeasonTo.getTime()} stroke="red" />}
      </LineChart>
    </ResponsiveContainer>
  );
}
