import { Accordion, Stack } from "@chakra-ui/react";
import { json, unstable_defineLoader as defineLoader } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Leaderboard } from "~/components/Leaderboard";
import { db } from "~/db.server";
import { PathHeader } from "~/components/PathHeader";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { getExtra } from "~/utils";

export const loader = defineLoader(async () => {
  const slug = "one-crazy-random-summer";

  const path = await db.path.findFirst({ where: { slug } });

  if (!path) throw json({ message: "Invalid path name" }, { status: 400 });

  const bestHCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
  });
  const bestSCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
  });
  const funnestHCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    special: true,
  });
  const funnestSCEver = await db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    special: true,
  });

  const funnestHCInSeason = await db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    inSeason: true,
    special: true,
  });
  const funnestSCInSeason = await db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    inSeason: true,
    special: true,
  });
  const bestHCInSeason = await db.ascension.getLeaderboard({
    path,
    lifestyle: "HARDCORE",
    inSeason: true,
  });
  const bestSCInSeason = await db.ascension.getLeaderboard({
    path,
    lifestyle: "SOFTCORE",
    inSeason: true,
  });

  const frequency = await db.ascension.getFrequency({ path });
  const recordBreaking = await db.ascension.getRecordBreaking(path);

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
    recordBreaking,
  };
});

export const meta = () => {
  return [
    { title: `Saṃsāra - One Crazy Random Summer` },
    {
      name: "description",
      content: `Ascension stats for the One Crazy Random Summer path`,
    },
  ];
};

const getFunScore = getExtra("Fun");

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
    recordBreaking,
  } = useLoaderData<typeof loader>();

  return (
    <Stack spacing={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
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
