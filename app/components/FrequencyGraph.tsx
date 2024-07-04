import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatTick, calculateRange, compactNumberFormatter } from "~/utils";

type Datum = { date: Date; count: number };
type Props = {
  data: Datum[];
  untilNow?: boolean;
  inSeasonTo?: Date | null;
};

export function FrequencyGraph({ data, inSeasonTo, untilNow }: Props) {
  const range = calculateRange(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
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
        <Line type="monotone" dataKey="count" dot={false} />
        {inSeasonTo && <ReferenceLine x={inSeasonTo.getTime()} stroke="red" />}
      </LineChart>
    </ResponsiveContainer>
  );
}
