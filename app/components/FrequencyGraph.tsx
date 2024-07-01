import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { date: Date; count: number };
type Props = { data: Datum[]; inSeasonTo?: Date | null };

const compactNumber = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function FrequencyGraph({ data, inSeasonTo }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} title="Ascensions over time">
        <XAxis
          type="number"
          dataKey={(d: Datum) => d.date.getTime()}
          tick={{ fontSize: 9 }}
          tickFormatter={(ts: number) => new Date(ts).getFullYear().toString()}
          domain={["dataMin", "dataMax"]}
        />
        <YAxis
          tick={{ fontSize: 9 }}
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
