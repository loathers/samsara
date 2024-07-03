import { Lifestyle } from "@prisma/client";
import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TogglableLegend } from "../TogglableLegend";
import { DaysDot } from "./DaysDot";
import { formatLifestyle } from "../Lifestyle";
import { calculateRange, formatTick, fullDateFormatter } from "~/utils";

export type RecordDatum = {
  days: number;
  turns: number;
  date: Date;
  lifestyle: Lifestyle;
  extra: JsonValue;
  player: { name: string; id: number };
};

type Props = {
  data: RecordDatum[];
  extra?: string;
};

function backwardsSearchFrom<T>(
  array: T[],
  index: number,
  cb: (value: T, index: number) => boolean,
) {
  for (let i = index; i >= 0; i--) {
    if (cb(array[i], i)) return array[i];
  }
  return undefined;
}

const compactNumber = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const LIFESTYLE_COLOUR = {
  HARDCORE: "#F56565", // red.400
  SOFTCORE: "#4299e1", // blue.400
  CASUAL: "#ECC94B", // yellow.400
};

export function RecordGraph({ data, extra }: Props) {
  const [seriesShown, setSeriesShown] = useState<Record<Lifestyle, boolean>>({
    HARDCORE: true,
    SOFTCORE: true,
    CASUAL: true,
  });

  const range = calculateRange(data);

  const graphData = data.map((d) => ({
    [d.lifestyle]: extra ? (d.extra as JsonObject)[extra] : d.turns,
    ...d,
  }));

  const lifestyles = [...new Set(data.map((d) => d.lifestyle))];

  const formatRunForTooltip = (run: RecordDatum) => {
    if (extra)
      return `${compactNumber.format(parseInt((run.extra as JsonObject)[extra] as string))} ${extra} ${run.player.name} (#${run.player.id})`;
    return `${run.days}/${run.turns} ${run.player.name} (#${run.player.id})`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={graphData}
        title="Ascensions over time"
        margin={{ top: 0, bottom: 0, right: 5 }}
      >
        <XAxis
          type="number"
          dataKey={(d) => d.date.getTime()}
          tickFormatter={(ts: number) => formatTick(ts, range)}
          tick={{ fontSize: 8 }}
          domain={["dataMin", "dataMax"]}
        />
        <YAxis
          tick={{ fontSize: 8 }}
          domain={[0, "auto"]}
          width={25}
          tickFormatter={(num: number) => compactNumber.format(num)}
        />
        {lifestyles.map((lifestyle) => (
          <Line
            key={lifestyle}
            hide={!seriesShown[lifestyle]}
            connectNulls={true}
            type="stepAfter"
            dataKey={lifestyle}
            stroke={LIFESTYLE_COLOUR[lifestyle]}
            dot={
              extra
                ? true
                : ({
                    cx,
                    cy,
                    stroke,
                    fill,
                    r,
                    strokeWidth,
                    key,
                    index,
                    payload: { lifestyle, days },
                  }) => {
                    if (cx === null || cy === null) return <svg key={key} />;
                    const last = backwardsSearchFrom(
                      graphData,
                      index - 1,
                      (d) => d.lifestyle === lifestyle,
                    );
                    if (last && last.days <= days) return <svg key={key} />;
                    return (
                      <DaysDot
                        days={days}
                        r={r}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        cx={cx}
                        cy={cy}
                        key={key}
                      />
                    );
                  }
            }
          />
        ))}
        <Tooltip
          labelFormatter={(ts: number) =>
            fullDateFormatter.format(new Date(ts))
          }
          formatter={(value, name, { payload }) => [
            formatRunForTooltip(payload),
            null,
          ]}
        />
        {lifestyles.length > 1 && (
          <Legend
            layout={undefined}
            width={0}
            align="right"
            verticalAlign="top"
            content={
              <TogglableLegend
                value={seriesShown}
                onChange={setSeriesShown}
                formatLabel={(value) =>
                  formatLifestyle(value as Lifestyle, "acronyms")
                }
              />
            }
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
