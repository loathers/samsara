import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { JsonValue } from "@prisma/client/runtime/library";
import { json, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo } from "react";
import { FrequencyGraph } from "~/components/FrequencyGraph";
import { Leaderboard } from "~/components/Leaderboard";
import { FormattedDate } from "~/components/FormattedDate";
import { db } from "~/db.server";
import { getLeaderboard } from "~/utils";

export const loader = async () => {
  const slug = "grey-goo";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE", "Goo Score");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE", "Goo Score");
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", "Goo Score", path.end)
    : null;
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", "Goo Score", path.end)
    : null;

  const stats = await db.ascension.getStats(undefined, path.name);

  return json({
    path,
    stats,
    bestHCEver,
    bestSCEver,
    bestHCInSeason,
    bestSCInSeason,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Saṃsāra ♻️ - ${data?.path}` },
    {
      name: "description",
      content: `Ascension stats for the ${data?.path} path`,
    },
  ];
};

const numberFormat = new Intl.NumberFormat("en-GB");

function getGooScore(a: { extra: JsonValue }) {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return numberFormat.format(Number(a.extra["Goo Score"] ?? 0));
}

export default function GreyGooPath() {
  const {
    path,
    stats,
    bestHCInSeason,
    bestHCEver,
    bestSCEver,
    bestSCInSeason,
  } = useLoaderData<typeof loader>();

  const scLeaderboard = useMemo(
    () => bestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCInSeason],
  );
  const hcLeaderboard = useMemo(
    () => bestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCInSeason],
  );
  const scPyrites = useMemo(
    () => bestSCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCEver],
  );
  const hcPyrites = useMemo(
    () => bestHCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCEver],
  );

  return (
    <Stack spacing={10}>
      <Stack alignItems="center">
        <Heading>{path.name}</Heading>
        {path.start && path.end && (
          <Text size="md">
            <FormattedDate date={path.start} /> -{" "}
            <FormattedDate date={path.end} />
          </Text>
        )}
      </Stack>
      <Box height={150} width="50%" alignSelf="center">
        <FrequencyGraph data={stats} inSeasonTo={path.end} />
      </Box>
      <Accordion allowToggle>
        {scLeaderboard && hcLeaderboard && (
          <AccordionItem>
            <AccordionButton>
              <HStack flex={1}>
                <Heading size="md">Leaderboards (Goo)</Heading>{" "}
                <Text>
                  The official leaderboards frozen once the path went
                  out-of-season. This season was ranked by Goo score, rather
                  than days and turns.
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <HStack alignItems="start">
                <Leaderboard
                  title="Softcore Leaderboard"
                  ascensions={scLeaderboard}
                  alternativeScore={["Goo", getGooScore]}
                />
                <Leaderboard
                  title="Hardcore Leaderboard"
                  ascensions={hcLeaderboard}
                  alternativeScore={["Goo", getGooScore]}
                />
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        )}
        <AccordionItem>
          <AccordionButton>
            <HStack flex={1}>
              <Heading size="md">Pyrites (Goo)</Heading>{" "}
              <Text>
                A hypothetical leaderboard for all-time; invented, respected,
                and dominated by fools
              </Text>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <HStack alignItems="start">
              <Leaderboard
                title="Softcore Pyrites"
                ascensions={scPyrites}
                alternativeScore={["Goo", getGooScore]}
              />
              <Leaderboard
                title="Hardcore Pyrites"
                ascensions={hcPyrites}
                alternativeScore={["Goo", getGooScore]}
              />
            </HStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
