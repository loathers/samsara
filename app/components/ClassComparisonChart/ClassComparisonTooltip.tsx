import { Box, Text } from "@chakra-ui/react";

import type { ClassComparisonRow } from "~/db.server";
import { formatClassComparison } from "~/utils";

type Props = {
  active?: boolean;
  payload?: { payload: ClassComparisonRow }[];
};

export function ClassComparisonTooltip({ active, payload }: Props) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const { headline, detail } = formatClassComparison(row);

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
      <Text fontSize="xs">{headline}</Text>
      <Text fontSize="xs" color="fg.muted">
        {detail}
      </Text>
    </Box>
  );
}
