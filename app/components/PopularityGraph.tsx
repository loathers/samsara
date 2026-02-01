import { HStack, Text } from "@chakra-ui/react";
import { Lifestyle } from "@prisma/client";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { ClientOnly } from "~/components/ClientOnly";
import { PathLink } from "~/components/PathLink";
import { formatTick } from "~/utils";
import { createConstrainedColor } from "~/utils/color";

type Datum = {
  date: Date;
  path: { slug: string; name: string; image: string | null };
  lifestyle: Lifestyle;
  count: number;
};
type Props = { data: Datum[] };

const shortenLifestyle = (l: Lifestyle) => (l === "HARDCORE" ? "HC" : "SC");

const toKey = (d: Datum) => `${shortenLifestyle(d.lifestyle)} ${d.path.name}`;

export function PopularityGraph({ data }: Props) {
  const dateData = data.map((d) => ({ ...d, date: new Date(d.date) }));
  const { resolvedTheme } = useTheme();
  const [minLightness, maxLightness] =
    resolvedTheme === "dark" ? [30, 75] : [25, 70];
  const [seriesData, seriesKeys, paths] = useMemo(() => {
    const paths = dateData.reduce(
      (acc, d) => {
        const key = toKey(d);
        return {
          ...acc,
          [key]: {
            key,
            lifestyle: d.lifestyle,
            path: d.path,
            total: (acc[key] ?? { total: 0 }).total + d.count,
          },
        };
      },
      {} as Record<
        string,
        {
          key: string;
          lifestyle: Lifestyle;
          path: { name: string; slug: string; image: string | null };
          total: number;
        }
      >,
    );

    const top10 = Object.values(paths)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((d) => d.key);

    const dataObjects = Object.values(
      dateData
        .filter((d) => top10.includes(toKey(d)))
        .reduce(
          (acc, d) => ({
            ...acc,
            [d.date.toISOString()]: {
              ...(acc[d.date.toISOString()] || {
                date: d.date,
              }),
              [toKey(d)]: d.count,
            },
          }),
          {} as Record<string, Record<string, number>>,
        ),
    );

    // Sort by rightmost position (value at last data point) descending
    const lastDataPoint = dataObjects[dataObjects.length - 1];
    const sortedTop10 = [...top10].sort((a, b) => {
      const aVal = (lastDataPoint?.[a] as number) ?? 0;
      const bVal = (lastDataPoint?.[b] as number) ?? 0;
      return bVal - aVal;
    });

    return [
      dataObjects,
      sortedTop10.map((dataKey) => ({
        dataKey,
        stroke: createConstrainedColor(dataKey, minLightness, maxLightness),
      })),
      paths,
    ];
  }, [data, minLightness, maxLightness]);

  const [active, setActive] = useState<string | null>(null);

  return (
    <ClientOnly>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={seriesData}
          title="Popularity of different paths over the last week"
          margin={{ top: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            dataKey={(d: Datum) => d.date.getTime()}
            tick={{ fontSize: 8 }}
            tickFormatter={(ts: number) => formatTick(ts, seriesData.length)}
            tickCount={8}
            domain={["dataMin", "dataMax"]}
          />
          <YAxis tick={{ fontSize: 8 }} domain={[0, "auto"]} width={25} />
          {seriesKeys.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              strokeWidth={line.dataKey === active ? 2 : 1}
              stroke={!active || line.dataKey === active ? line.stroke : "grey"}
              dot={false}
              activeDot={false}
              strokeOpacity={!active || line.dataKey === active ? 1 : 0.3}
            />
          ))}
          <Legend
            iconType="circle"
            layout="vertical"
            content={({ payload }) => (
              <HStack gap={2} fontSize="xs" textAlign="center" flexWrap="wrap">
                {payload?.map((entry) => {
                  const value = entry.value;
                  if (!value) return null;
                  return (
                    <HStack
                      gap={1}
                      key={entry.value}
                      onMouseEnter={() => setActive(value)}
                      onMouseLeave={() => setActive(null)}
                    >
                      <Text as="span" color={entry.color}>
                        &#x25CF;
                      </Text>{" "}
                      <PathLink
                        path={paths[value].path}
                        lifestyle={paths[value].lifestyle}
                        shorten="acronyms"
                      />
                    </HStack>
                  );
                })}
              </HStack>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </ClientOnly>
  );
}
