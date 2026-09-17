import { Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuInfo } from "react-icons/lu";

import { Popover } from "~/components/Popover";
import type { JsonValue } from "~/db";
import { formatExtraKey, formatExtraValue } from "~/utils";

/** What a run recorded beyond the measures its path is ranked on. */
export function ExtraInfo({ entries }: { entries: [string, JsonValue][] }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={({ open }) => setOpen(open)}>
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
            {entries.map(([key, value]) => (
              <Text key={key} fontSize="sm">
                {formatExtraKey(key)}: {formatExtraValue(value)}
              </Text>
            ))}
          </Stack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
