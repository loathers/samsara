import {
  Box,
  Button,
  Group,
  HStack,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { Link } from "react-router";

import { FormattedDate } from "~/components/FormattedDate";
import { FrequencyGraph } from "~/components/FrequencyGraph";
import { Path } from "~/components/Path";
import { PathIcon } from "~/components/PathIcon";
import { RecordDatum, RecordGraph } from "~/components/RecordGraph/RecordGraph";
import { getDifferenceInMonths, numberFormatter } from "~/utils";

type Datum = { date: Date; count: number };
type Props = {
  path: {
    name: string;
    seasonal: boolean;
    start: Date | null;
    end: Date | null;
    image: string | null;
  };
  totalRuns: number;
  totalRunsInSeason?: number;
  frequency: Datum[];
  recordBreaking: RecordDatum[];
  extra?: string;
};

export function PathHeader({
  path,
  frequency,
  recordBreaking,
  extra,
  totalRuns,
  totalRunsInSeason,
}: Props) {
  const lines = useMemo(() => {
    if (!path.seasonal || !path.end) return [];
    return [{ time: new Date(path.end).getTime(), label: "Season end" }];
  }, [path]);

  function Stats() {
    return (
      <Stack
        direction="row"
        gap={2}
        textStyle="md"
        separator={<Text borderStyle="none">•</Text>}
      >
        <Text>
          {numberFormatter.format(totalRuns)} total run
          {totalRuns !== 1 ? "s" : ""}
        </Text>
        {totalRunsInSeason && (
          <Text>{numberFormatter.format(totalRunsInSeason)} in season</Text>
        )}
        {totalRuns && frequency.length && (
          <Text>
            {numberFormatter.format(
              totalRuns / getDifferenceInMonths(frequency[0].date),
            )}{" "}
            runs per month
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack alignItems="center">
      <HStack>
        <Heading size="4xl">
          <Path path={path} />
        </Heading>
        {path.image !== "blank" && <PathIcon path={path} />}
      </HStack>
      {path.start && path.end && (
        <Text textStyle="md">
          <FormattedDate date={path.start} /> -{" "}
          <FormattedDate date={path.end} />
        </Text>
      )}
      <Stats />
      <Group justifyContent="center">
        <Button asChild>
          <Link to="/">home</Link>
        </Button>
      </Group>
      <Stack direction={["column", null, "row"]} width="100%">
        <Box
          textAlign="center"
          mt={8}
          height={150}
          width="100%"
          alignSelf="center"
        >
          <FrequencyGraph data={frequency} lines={lines} />
          <Text fontSize="2xs">Ascension frequency over time</Text>
        </Box>
        <Box
          textAlign="center"
          mt={8}
          height={150}
          width="100%"
          alignSelf="center"
        >
          <RecordGraph data={recordBreaking} extra={extra} />
          <Text fontSize="2xs">Progression of best runs over time</Text>
        </Box>
      </Stack>
    </Stack>
  );
}
