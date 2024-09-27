import {
  HStack,
  Stack,
  Heading,
  Text,
  Box,
  ButtonGroup,
  Button,
} from "@chakra-ui/react";

import { FrequencyGraph } from "./FrequencyGraph";
import { FormattedDate } from "./FormattedDate";
import { Link } from "@remix-run/react";
import { RecordDatum, RecordGraph } from "./RecordGraph/RecordGraph";
import { PathIcon } from "./PathIcon";
import { Path } from "./Path";
import { useMemo } from "react";

type Datum<D = Date> = { date: D; count: number };
type Props = {
  path: {
    name: string;
    seasonal: boolean;
    start: string | null;
    end: string | null;
    image: string | null;
  };
  frequency: Datum<string>[];
  recordBreaking: RecordDatum<string>[];
  extra?: string;
};

export function PathHeader({ path, frequency, recordBreaking, extra }: Props) {
  const lines = useMemo(() => {
    if (!path.seasonal || !path.end) return [];
    return [{ time: new Date(path.end).getTime(), label: "Season end" }];
  }, [path]);

  return (
    <Stack alignItems="center">
      <HStack>
        <Heading>
          <Path path={path} />
        </Heading>
        <PathIcon path={path} />
      </HStack>
      {path.start && path.end && (
        <Text size="md">
          <FormattedDate date={path.start} /> -{" "}
          <FormattedDate date={path.end} />
        </Text>
      )}
      <ButtonGroup justifyContent="center">
        <Button as={Link} to="/">
          home
        </Button>
      </ButtonGroup>
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
