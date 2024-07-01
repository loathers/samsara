import { HStack, Stack, Heading, Image, Text, Box } from "@chakra-ui/react";

import { FrequencyGraph } from "./FrequencyGraph";
import { FormattedDate } from "./FormattedDate";
import { formatPathName } from "../utils";

type Datum = { date: string; count: number };
type Props = {
  path: {
    name: string;
    start: string | null;
    end: string | null;
    image: string | null;
  };
  stats: Datum[];
  isSeasonal?: boolean;
};

export function PathHeader({ path, stats, isSeasonal = true }: Props) {
  return (
    <>
      <Stack alignItems="center">
        <HStack>
          <Heading>{formatPathName(path.name)}</Heading>
          {path.image && (
            <Image
              src={`https://s3.amazonaws.com/images.kingdomofloathing.com/itemimages/${path.image}.gif`}
            />
          )}
        </HStack>
        {path.start && path.end && (
          <Text size="md">
            <FormattedDate date={path.start} /> -{" "}
            <FormattedDate date={path.end} />
          </Text>
        )}
      </Stack>
      <Box height={150} width={["100%", null, "60%"]} alignSelf="center">
        <FrequencyGraph
          data={stats}
          inSeasonTo={isSeasonal ? path.start : path.end}
        />
      </Box>
    </>
  );
}
