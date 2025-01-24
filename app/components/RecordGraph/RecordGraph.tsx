import { useToken } from "@chakra-ui/react";
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

import { formatLifestyle } from "~/components/Lifestyle";
import { DaysDot } from "~/components/RecordGraph/DaysDot";
import { TogglableLegend } from "~/components/TogglableLegend";
import {
  backwardsSearchFrom,
  calculateRange,
  compactNumberFormatter,
  formatTick,
  fullDateFormatter,
} from "~/utils";

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

const LIFESTYLE_COLOUR = {
  HARDCORE: "#F56565", // red.400
  SOFTCORE: "#4299e1", // blue.400
  CASUAL: "#ECC94B", // yellow.400
};

export function RecordGraph({ data, extra }: Props) {
  const dateData = data.map((d) => ({ ...d, date: new Date(d.date) }));
  const [seriesShown, setSeriesShown] = useState<Record<Lifestyle, boolean>>({
    HARDCORE: true,
    SOFTCORE: true,
    CASUAL: true,
  });

  const range = calculateRange(dateData);

  const graphData = dateData.map((d) => ({
    [d.lifestyle]: extra ? (d.extra as JsonObject)[extra] : d.turns,
    ...d,
  }));

  const lifestyles = [...new Set(dateData.map((d) => d.lifestyle))];

  const formatRunForTooltip = (run: RecordDatum) => {
    if (extra)
      return `${compactNumberFormatter.format(parseInt((run.extra as JsonObject)[extra] as string))} ${extra} ${run.player.name} (#${run.player.id})`;
    return `${run.days}/${run.turns} ${run.player.name} (#${run.player.id})`;
  };

  const [bg] = useToken("colors", ["bg"]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={graphData}
        title="Progression of best runs over time"
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
          tickFormatter={(num: number) => compactNumberFormatter.format(num)}
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
                        fill={bg}
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
          contentStyle={{
            backgroundColor: bg,
          }}
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
