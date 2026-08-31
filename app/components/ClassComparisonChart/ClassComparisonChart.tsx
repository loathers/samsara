import { Box, Heading, Stack, Text, useToken } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useCallback } from "react";
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
import { MIN_CLASSES_PER_PLAYER, percentFormatter } from "~/utils";

type Props = {
  title: string;
  data: ClassComparisonRow[];
};

const MARGIN = { top: 5, bottom: 0, left: 0, right: 10 };
const TICK = { fontSize: 8 };
const CURSOR = { strokeDasharray: "3 3" };
const TOOLTIP = <ClassComparisonTooltip />;
const ROW_HEIGHT = 26;

// So a spread in one season is comparable with another's.
const DOMAIN: [number, number] = [0, 1];
const TICKS = [0, 0.25, 0.5, 0.75, 1];

export function ClassComparisonChart({ title, data }: Props) {
  const [zero] = useToken("colors", ["gray.500"]);
  const { resolvedTheme } = useTheme();

  const invert = resolvedTheme === "dark";
  const shape = useCallback(
    ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: ClassComparisonRow }) =>
      payload ? (
        <ClassIconDot
          class={{ name: payload.className, image: payload.classImage }}
          invert={invert}
          cx={cx}
          cy={cy}
        />
      ) : null,
    [invert],
  );

  return (
    <Stack gap={2} mt={10} width="100%">
      <Heading textAlign="center" as="h3" size="sm" color="fg">
        {title}
      </Heading>
      {data.length === 0 ? (
        <Text textAlign="center" fontSize="sm" color="fg.muted">
          Nobody ran {MIN_CLASSES_PER_PLAYER} or more classes this season
        </Text>
      ) : (
        <>
          <Box height={40 + data.length * ROW_HEIGHT} width="100%">
            <ClientOnly>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={MARGIN}>
                  <XAxis
                    type="number"
                    dataKey="winRate"
                    domain={DOMAIN}
                    ticks={TICKS}
                    tick={TICK}
                    tickFormatter={percentFormatter.format}
                  />
                  <YAxis type="category" dataKey="className" hide reversed />
                  <ReferenceLine x={0.5} stroke={zero} />
                  <Scatter data={data} shape={shape} />
                  <Tooltip cursor={CURSOR} content={TOOLTIP} />
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
