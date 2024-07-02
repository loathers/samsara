import { Checkbox, Stack } from "@chakra-ui/react";
import { Lifestyle } from "@prisma/client";
import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { SetStateAction, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatLifestyle } from "~/utils";

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

const compactNumber = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat(undefined, {});

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
          tickFormatter={(ts: number) => new Date(ts).getFullYear().toString()}
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
            dot={true}
          />
        ))}
        <Tooltip
          labelFormatter={(ts: number) => dateFormatter.format(new Date(ts))}
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
              <ToggleLegend value={seriesShown} onChange={setSeriesShown} />
            }
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

type ToggleLegendProps<T extends Record<string, boolean>> = {
  value: T;
  onChange: React.Dispatch<SetStateAction<T>>;
  payload?: { value: keyof T }[];
};

function ToggleLegend<T extends Record<string, boolean>>(
  props: ToggleLegendProps<T>,
) {
  const { value, onChange, payload } = props;
  return (
    <Stack spacing={2} direction={"row"} justifyContent="center">
      {payload!.map((entry) => (
        <Checkbox
          size="sm"
          key={entry.value as string}
          type="checkbox"
          defaultChecked={value[entry.value]}
          onChange={(e) =>
            onChange((v) => ({ ...v, [entry.value]: e.target.checked }))
          }
        >
          {formatLifestyle(entry.value as Lifestyle, true)}
        </Checkbox>
      ))}
    </Stack>
  );
}
