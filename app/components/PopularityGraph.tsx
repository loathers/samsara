import { HStack, Text } from "@chakra-ui/react";
import { Lifestyle } from "@prisma/client";
import createColor from "create-color";
import { useMemo } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { PathLink } from "~/components/PathLink";
import { formatTick } from "~/utils";

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

    return [
      dataObjects,
      top10.map((dataKey) => ({ dataKey, stroke: createColor(dataKey) })),
      paths,
    ];
  }, [data]);

  return (
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
          <Line key={line.dataKey} type="monotone" {...line} dot={false} />
        ))}
        <Legend
          iconType="circle"
          layout="vertical"
          content={({ payload }) => (
            <HStack gap={2} fontSize="xs" textAlign="center" flexWrap="wrap">
              {payload?.map((entry) => (
                <HStack gap={1} key={entry.value}>
                  <Text as="span" color={entry.color}>
                    &#x25CF;
                  </Text>{" "}
                  <PathLink
                    path={paths[entry.value].path}
                    lifestyle={paths[entry.value].lifestyle}
                    shorten="acronyms"
                  />
                </HStack>
              ))}
            </HStack>
          )}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
