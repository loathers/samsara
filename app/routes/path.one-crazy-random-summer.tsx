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
  const slug = "one-crazy-random-summer";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path.name, "HARDCORE");
  const bestSCEver = await getLeaderboard(path.name, "SOFTCORE");
  const funnestHCEver = await getLeaderboard(path.name, "HARDCORE", "Fun");
  const funnestSCEver = await getLeaderboard(path.name, "SOFTCORE", "Fun");

  const funnestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", "Fun", path.end)
    : null;
  const funnestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", "Fun", path.end)
    : null;
  const bestHCInSeason = path.end
    ? await getLeaderboard(path.name, "HARDCORE", undefined, path.end)
    : null;
  const bestSCInSeason = path.end
    ? await getLeaderboard(path.name, "SOFTCORE", undefined, path.end)
    : null;

  const stats = await db.ascension.getStats(undefined, path.name);

  return json({
    bestHCEver,
    bestHCInSeason,
    bestSCEver,
    bestSCInSeason,
    funnestHCEver,
    funnestHCInSeason,
    funnestSCEver,
    funnestSCInSeason,
    path,
    stats,
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

function getFunScore(a: { extra: JsonValue }) {
  if (typeof a.extra !== "object" || a.extra === null || Array.isArray(a.extra))
    return 0;
  return numberFormat.format(Number(a.extra["Fun"] ?? 0));
}

export default function OCRSPath() {
  const {
    bestHCEver,
    bestHCInSeason,
    bestSCEver,
    bestSCInSeason,
    funnestHCEver,
    funnestHCInSeason,
    funnestSCEver,
    funnestSCInSeason,
    path,
    stats,
  } = useLoaderData<typeof loader>();

  const scLeaderboard = useMemo(
    () => bestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestSCInSeason],
  );
  const hcLeaderboard = useMemo(
    () => bestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [bestHCInSeason],
  );
  const scFunLeaderboard = useMemo(
    () => funnestSCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestSCInSeason],
  );
  const hcFunLeaderboard = useMemo(
    () => funnestHCInSeason?.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestHCInSeason],
  );
  const scFunPyrites = useMemo(
    () => funnestSCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestSCEver],
  );
  const hcFunPyrites = useMemo(
    () => funnestHCEver.map((a) => ({ ...a, date: new Date(a.date) })),
    [funnestHCEver],
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
        {scFunLeaderboard && hcFunLeaderboard && (
          <AccordionItem>
            <AccordionButton>
              <HStack flex={1}>
                <Heading size="md">Leaderboards (Fun)</Heading>{" "}
                <Text>
                  The leaderboards frozen once the path went out-of-season. This
                  season was ranked by <i>Fun</i> score, rather than days and
                  turns.
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <HStack alignItems="start">
                <Leaderboard
                  title="Softcore Leaderboard"
                  ascensions={scFunLeaderboard}
                  alternativeScore={["Fun", getFunScore]}
                />
                <Leaderboard
                  title="Hardcore Leaderboard"
                  ascensions={hcFunLeaderboard}
                  alternativeScore={["Fun", getFunScore]}
                />
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        )}
        {scLeaderboard && hcLeaderboard && (
          <AccordionItem>
            <AccordionButton>
              <HStack flex={1}>
                <Heading size="md">Leaderboards (Days/Turns)</Heading>{" "}
                <Text>
                  Essentially a special pyrite, in-season leaderboard if this
                  had been a normally ranked path.
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <HStack alignItems="start">
                <Leaderboard
                  title="Softcore Leaderboard"
                  ascensions={scLeaderboard}
                  alternativeScore={["Fun", getFunScore]}
                />
                <Leaderboard
                  title="Hardcore Leaderboard"
                  ascensions={hcLeaderboard}
                  alternativeScore={["Fun", getFunScore]}
                />
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        )}
        <AccordionItem>
          <AccordionButton>
            <HStack flex={1}>
              <Heading size="md">Pyrites (Fun)</Heading>{" "}
              <Text>
                A hypothetical leaderboard for all-time; invented, respected,
                and dominated by fools.
              </Text>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <HStack alignItems="start">
              <Leaderboard
                title="Softcore Pyrites"
                ascensions={scFunPyrites}
                alternativeScore={["Fun", getFunScore]}
              />
              <Leaderboard
                title="Hardcore Pyrites"
                ascensions={hcFunPyrites}
                alternativeScore={["Fun", getFunScore]}
              />
            </HStack>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <HStack flex={1}>
              <Heading size="md">Pyrites (Days/Turns)</Heading>{" "}
              <Text>
                A doubly hypothetical leaderboard for all-time; invented,
                respected, and dominated by turbo-fools.
              </Text>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <HStack alignItems="start">
              <Leaderboard
                title="Softcore Pyrites"
                ascensions={scPyrites}
                alternativeScore={["Fun", getFunScore]}
              />
              <Leaderboard
                title="Hardcore Pyrites"
                ascensions={hcPyrites}
                alternativeScore={["Fun", getFunScore]}
              />
            </HStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
