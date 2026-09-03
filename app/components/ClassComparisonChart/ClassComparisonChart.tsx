import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import {
  Bar,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ClassComparisonTooltip } from "~/components/ClassComparisonChart/ClassComparisonTooltip";
import { ClassIconDot } from "~/components/ClassComparisonChart/ClassIconDot";
import { WinRateStar } from "~/components/ClassComparisonChart/WinRateStar";
import { ClientOnly } from "~/components/ClientOnly";
import type { ClassComparisonRow } from "~/db.server";
import { useTokenVar } from "~/hooks/useTokenVar";
import { percentFormatter } from "~/utils";

type Props = {
  title?: string;
  data: ClassComparisonRow[];
};

const MARGIN = { top: 5, bottom: 0, left: 0, right: 12 };
const TICK = { fontSize: 8 };
const CURSOR = { strokeDasharray: "3 3" };
const TOOLTIP = <ClassComparisonTooltip />;
const ROW_HEIGHT = 28;

// So a spread on one board is comparable with another's.
const DOMAIN: [number, number] = [0, 1];
const TICKS = [0, 0.25, 0.5, 0.75, 1];

export function ClassComparisonChart({
  title = "Class Performance",
  data,
}: Props) {
  const [zero, bar, star, starOutline] = useTokenVar("colors", [
    "gray.500",
    "bg.emphasized",
    "fg",
    "bg",
  ]);
  const { resolvedTheme } = useTheme();
  const invert = resolvedTheme === "dark";

  const axisTick = useCallback(
    ({
      x,
      y,
      payload,
    }: {
      x?: string | number;
      y?: string | number;
      payload?: { value: string };
    }) => {
      if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
      const row = data.find((d) => d.className === payload.value);
      return (
        <ClassIconDot
          class={{ name: payload.value, image: row?.classImage ?? null }}
          invert={invert}
          cx={x - 12}
          cy={y}
        />
      );
    },
    [data, invert],
  );

  const winRateShape = useCallback(
    ({ cx, cy }: { cx?: number | null; cy?: number | null }) => (
      <WinRateStar cx={cx} cy={cy} fill={star} stroke={starOutline} />
    ),
    [star, starOutline],
  );

  if (data.length === 0) return null;

  const hasWinRates = data.some((d) => d.winRate !== null);

  return (
    <Stack gap={2} mt={10} width="100%">
      <Heading textAlign="center" as="h3" size="sm" color="fg">
        {title}
      </Heading>
      <Box height={40 + data.length * ROW_HEIGHT} width="100%">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart layout="vertical" data={data} margin={MARGIN}>
              <XAxis
                type="number"
                domain={DOMAIN}
                ticks={TICKS}
                tick={TICK}
                tickFormatter={percentFormatter.format}
              />
              <YAxis
                type="category"
                dataKey="className"
                interval={0}
                width={28}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <ReferenceLine x={0.5} stroke={zero} />
              <Bar dataKey="share" fill={bar} barSize={14} isAnimationActive={false} />
              <Scatter
                dataKey="winRate"
                shape={winRateShape}
                isAnimationActive={false}
              />
              <Tooltip cursor={CURSOR} content={TOOLTIP} />
            </ComposedChart>
          </ResponsiveContainer>
        </ClientOnly>
      </Box>
      <Text fontSize="2xs" textAlign="center" color="fg.muted">
        Bar is the share of runs using each class.
        {hasWinRates &&
          " Star is the share of the same players' other runs it beats."}
      </Text>
    </Stack>
  );
}
