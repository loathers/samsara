import { Accordion, Stack } from "@chakra-ui/react";
import { JsonValue } from "@prisma/client/runtime/library";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { MetaArgs_SingleFetch, useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { getLeaderboard } from "~/utils.server";
import { formatPathName } from "~/utils";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";

export const loader = defineLoader(async () => {
  const slug = "one-crazy-random-summer";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await getLeaderboard(path, "HARDCORE");
  const bestSCEver = await getLeaderboard(path, "SOFTCORE");
  const funnestHCEver = await getLeaderboard(path, "HARDCORE", false, "Fun");
  const funnestSCEver = await getLeaderboard(path, "SOFTCORE", false, "Fun");

  const funnestHCInSeason = await getLeaderboard(path, "HARDCORE", true, "Fun");
  const funnestSCInSeason = await getLeaderboard(path, "SOFTCORE", true, "Fun");
  const bestHCInSeason = await getLeaderboard(path, "HARDCORE", true);
  const bestSCInSeason = await getLeaderboard(path, "SOFTCORE", true);

  const frequency = await db.ascension.getFrequency(path);
  const recordBreakers = await db.ascension.getRecordBreaking(path);

  return {
    bestHCEver,
    bestHCInSeason,
    bestSCEver,
    bestSCInSeason,
    funnestHCEver,
    funnestHCInSeason,
    funnestSCEver,
    funnestSCInSeason,
    path,
    frequency,
    recordBreakers,
  };
});

export const meta = ({ data }: MetaArgs_SingleFetch<typeof loader>) => {
  return [
    { title: `Saṃsāra ♻️ - ${formatPathName(data?.path.name ?? "Unknown")}` },
    {
      name: "description",
      content: `Ascension stats for the ${formatPathName(data?.path.name ?? "Unknown")} path`,
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
    frequency,
    recordBreakers,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreakers={recordBreakers}
        extra="Fun"
      />
      <Accordion allowToggle>
        <LeaderboardAccordionItem
          title="Leaderboards (Fun)"
          description={
            <>
              The leaderboards frozen once the path went out-of-season. This
              season was ranked by <i>Fun</i> score, rather than days and turns.
            </>
          }
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={funnestSCInSeason}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={funnestHCInSeason}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Leaderboards (Days/Turns)"
          description="Essentially a special pyrite; in-season leaderboards had this had been a normally ranked path."
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={bestSCInSeason}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={bestHCInSeason}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem title="Pyrites (Fun)" description="{PYRITE}">
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={funnestSCEver}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={funnestHCEver}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Pyrites (Days/Turns)"
          description="A doubly hypothetical leaderboard for all-time; invented, respected, and dominated by turbo-fools."
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={bestSCEver}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={bestHCEver}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
      </Accordion>
    </Stack>
  );
}
