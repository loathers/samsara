import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { OVERALL_BOARD } from "~/boards";
import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses, getLeaderboard } from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "bad-moon" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  const [pathData, casualLeaderboard] = await Promise.all([
    getPathData(path),
    // Without a board it would match both boards' tags.
    getLeaderboard({ path, lifestyle: "CASUAL", board: OVERALL_BOARD.key! }),
  ]);

  return { ...pathData, casualLeaderboard };
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Bad Moon` },
    {
      name: "description",
      content: `Ascension stats for the Bad Moon path(? sign?)`,
    },
  ];
};

export default function BadMoonPath() {
  const { casualLeaderboard, frequency, path, totalRuns, boards } =
    useLoaderData<typeof loader>();

  const overall = boards.find((b) => b.board.key === OVERALL_BOARD.key)!;
  const kittycore = boards.find((b) => b.board.key === "kittycore")!;

  const { classes, hcDedication, hcLeaderboard, hcRecent, scLeaderboard } =
    overall;

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
        totalRuns={totalRuns}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          title="Leaderboard"
          description="The official leaderboard as it currently stands"
        >
          <Leaderboard ascensions={hcLeaderboard}>
            <ClassComparisonChart
              data={classes.main.hardcore}
            />
          </Leaderboard>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="kittycore"
          title="Kittycore"
          description="Who has managed to condense the worst experience in the game into the smallest amount of time"
          stacked
        >
          <LeaderboardAccordion leaf>
            <LeaderboardAccordionItem
              slug="kittycore.leaderboard"
              title="Leaderboard"
              description="The best runs anyone has managed"
            >
              <Leaderboard ascensions={kittycore.hcLeaderboard} />
            </LeaderboardAccordionItem>
            <LeaderboardAccordionItem
              slug="kittycore.recent"
              title="Recent Ascensions"
              description="A chronological catalogue of psychosis"
            >
              <Leaderboard ascensions={kittycore.hcRecent} ranked={false} />
            </LeaderboardAccordionItem>
            <LeaderboardAccordionItem
              slug="kittycore.dedication"
              title="Dedication"
              description="The community's most gluttonous masochists"
            >
              <Dedication dedication={kittycore.hcDedication} />
            </LeaderboardAccordionItem>
          </LeaderboardAccordion>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="weird"
          title="Weird leaderboards"
          description="Some curious folks managed to run the path outside of Hardcore and we must respect their work"
        >
          <Leaderboard
            title="Softcore Leaderboard?"
            ascensions={scLeaderboard}
          />
          <Leaderboard
            title="Casual? Leaderboard??"
            ascensions={casualLeaderboard}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard ascensions={hcRecent} ranked={false} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Dedication" dedication={hcDedication} />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
