import { Stack, Text } from "@chakra-ui/react";
import { LuInfo } from "react-icons/lu";

import { Popover } from "~/components/Popover";
import type { JsonValue } from "~/db";
import { formatExtraEntry } from "~/utils";

/** What a run recorded beyond the measures its path is ranked on. */
export function ExtraInfo({ entries }: { entries: [string, JsonValue][] }) {
  return (
    <Popover.Root lazyMount unmountOnExit>
      <Popover.Trigger
        aria-label="Run details"
        title="Run details"
        cursor="pointer"
      >
        <LuInfo />
      </Popover.Trigger>
      <Popover.Content width="auto" maxWidth="xs">
        <Popover.Arrow />
        <Popover.Body>
          <Stack gap={1}>
            {entries.map((entry) => (
              <Text key={entry[0]} fontSize="sm">
                {formatExtraEntry(entry)}
              </Text>
            ))}
          </Stack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
