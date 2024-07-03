import {
  HStack,
  Stack,
  Heading,
  Image,
  Text,
  Box,
  ButtonGroup,
  Button,
} from "@chakra-ui/react";

import { FrequencyGraph } from "./FrequencyGraph";
import { FormattedDate } from "./FormattedDate";
import { formatPathName, PostgresInterval } from "../utils";
import { Link } from "@remix-run/react";
import { RecordDatum, RecordGraph } from "./RecordGraph/RecordGraph";

type Datum = { date: Date; count: number };
type Props = {
  path: {
    name: string;
    seasonal: boolean;
    start: Date | null;
    end: Date | null;
    image: string | null;
  };
  frequency: [data: Datum[], cadence: PostgresInterval];
  recordBreakers: RecordDatum[];
  extra?: string;
};

function formatImage(image: string | null) {
  if (image === "oxy") return "smalloxy";
  return image;
}

export function PathHeader({ path, frequency, recordBreakers, extra }: Props) {
  const image = formatImage(path.image);

  return (
    <Stack alignItems="center">
      <HStack>
        <Heading>{formatPathName(path.name)}</Heading>
        {image && (
          <Image
            src={`https://s3.amazonaws.com/images.kingdomofloathing.com/itemimages/${image}.gif`}
          />
        )}
      </HStack>
      {path.start && path.end && (
        <Text size="md">
          <FormattedDate date={path.start} /> -{" "}
          <FormattedDate date={path.end} />
        </Text>
      )}
      <ButtonGroup justifyContent="center">
        <Button as={Link} leftIcon={<span>←</span>} to="/">
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
          <FrequencyGraph
            data={frequency}
            inSeasonTo={path.seasonal ? path.end : null}
          />
          <Text fontSize="2xs">Ascension frequency over time</Text>
        </Box>
        <Box
          textAlign="center"
          mt={8}
          height={150}
          width="100%"
          alignSelf="center"
        >
          <RecordGraph data={recordBreakers} extra={extra} />
          <Text fontSize="2xs">Progression of best runs over time</Text>
        </Box>
      </Stack>
    </Stack>
  );
}
