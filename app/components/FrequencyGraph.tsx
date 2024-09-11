import { useMemo } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { formatTick, calculateRange, compactNumberFormatter } from "~/utils";

type Datum<D = Date> = { date: D; count: number };
type Props = {
  data: Datum<string>[];
  untilNow?: boolean;
  inSeasonTo?: string | Date | null;
};

export function FrequencyGraph({ data, inSeasonTo, untilNow }: Props) {
  const dateData = useMemo(
    () => data.map((d) => ({ ...d, date: new Date(d.date) })),
    [data],
  );
  const range = calculateRange(dateData);
  const seasonTime = useMemo(() => {
    if (!inSeasonTo) return null;
    const d = inSeasonTo instanceof Date ? inSeasonTo : new Date(inSeasonTo);
    return d.getTime();
  }, [inSeasonTo]);

  return (
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
        <Line type="monotone" dataKey="count" dot={false} />
        {seasonTime && <ReferenceLine x={seasonTime} stroke="red" />}
      </LineChart>
    </ResponsiveContainer>
  );
}
