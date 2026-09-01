import { Box, Text } from "@chakra-ui/react";

import type { ClassComparisonRow } from "~/db.server";
import { numberFormatter, percentFormatter } from "~/utils";

type Props = {
  active?: boolean;
  payload?: { payload: ClassComparisonRow }[];
};

/** Within this of an even split the class is not pulling either way. */
const NEGLIGIBLE_WIN_RATE = 0.01;

const NEGLIGIBLE_TURNS = 0.5;

export function formatClassComparison(row: ClassComparisonRow) {
  const share = `${percentFormatter.format(row.share)} of runs on this board`;

  const against = row.year
    ? `the same players' other ${row.year} ${row.lifestyle.toLowerCase()} runs`
    : `the same players' other runs on this path`;

  const headline =
    row.winRate === null
      ? "Too few players ran several classes to compare"
      : Math.abs(row.winRate - 0.5) < NEGLIGIBLE_WIN_RATE
        ? `An even match for ${against}`
        : `Beats ${percentFormatter.format(row.winRate)} of ${against}`;

  const detail =
    row.turnDelta === null
      ? null
      : Math.abs(row.turnDelta) < NEGLIGIBLE_TURNS
        ? "No turn difference on average, at best daycount per player"
        : `${numberFormatter.format(Math.round(Math.abs(row.turnDelta)))} ${
            row.turnDelta < 0 ? "fewer" : "more"
          } turns on average, at best daycount per player`;

  return { share, headline, detail };
}

export function ClassComparisonTooltip({ active, payload }: Props) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const { share, headline, detail } = formatClassComparison(row);

  return (
    <Box
      bg="bg"
      borderWidth={1}
      borderRadius="md"
      px={3}
      py={2}
      maxWidth={64}
      shadow="md"
    >
      <Text fontWeight="bold" fontSize="sm">
        {row.className}
      </Text>
      <Text fontSize="xs">{share}</Text>
      <Text fontSize="xs">{headline}</Text>
      {detail && (
        <Text fontSize="xs" color="fg.muted">
          {detail}
        </Text>
      )}
    </Box>
  );
}
