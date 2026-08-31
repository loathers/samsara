import { Box, Heading, Stack, Text, useToken } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import {
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ClassComparisonTooltip } from "~/components/ClassComparisonChart/ClassComparisonTooltip";
import { ClassIconDot } from "~/components/ClassComparisonChart/ClassIconDot";
import { ClientOnly } from "~/components/ClientOnly";
import type { ClassComparisonRow } from "~/db.server";
import { classComparisonDomain, percentFormatter } from "~/utils";

type Props = {
  title?: string;
  data: ClassComparisonRow[];
};

export function ClassComparisonChart({ title, data }: Props) {
  const [zero] = useToken("colors", ["gray.500"]);
  const { resolvedTheme } = useTheme();

  return (
    <Stack gap={2} mt={10} width="100%">
      {title && (
        <Heading textAlign="center" as="h3" size="sm" color="fg">
          {title}
        </Heading>
      )}
      {data.length === 0 ? (
        <Text textAlign="center" fontSize="sm" color="fg.muted">
          Nobody ran two or more classes this season
        </Text>
      ) : (
        <>
          <Box height={40 + data.length * 26} width="100%">
            <ClientOnly>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  title="Share of the same players' other runs each class beats"
                  margin={{ top: 5, bottom: 0, left: 0, right: 10 }}
                >
                  <XAxis
                    type="number"
                    dataKey="winRate"
                    domain={classComparisonDomain(data)}
                    tick={{ fontSize: 8 }}
                    tickFormatter={(d: number) => percentFormatter.format(d)}
                  />
                  {/* Hidden, but still gives each class its own row. */}
                  <YAxis type="category" dataKey="className" hide reversed />
                  <ReferenceLine x={0.5} stroke={zero} />
                  <Scatter
                    data={data}
                    shape={({ cx, cy, payload }) => (
                      <ClassIconDot
                        class={{
                          name: payload.className,
                          image: payload.classImage,
                        }}
                        invert={resolvedTheme === "dark"}
                        cx={cx}
                        cy={cy}
                      />
                    )}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={<ClassComparisonTooltip />}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ClientOnly>
          </Box>
          <Text fontSize="2xs" textAlign="center" color="fg.muted">
            Share of the same players&apos; other runs each class beats, days
            compared before turns. Right is better.
          </Text>
        </>
      )}
    </Stack>
  );
}
