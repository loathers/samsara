import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import {
  findPathWithClasses,
  getKittycoreLeaderboard,
  getLeaderboard,
  getRecentAscensions,
} from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "bad-moon" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  const [pathData, casualLeaderboard, kittycoreLeaderboard, kittycoreRecent] =
    await Promise.all([
      getPathData(path),
      getLeaderboard({ path, lifestyle: "CASUAL" }),
      getKittycoreLeaderboard(),
      getRecentAscensions({ path, lifestyle: "HARDCORE", familiar: "Black Cat" }),
    ]);

  return {
    ...pathData,
    casualLeaderboard,
    kittycoreLeaderboard,
    kittycoreRecent,
  };
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
  const {
    casualLeaderboard,
    frequency,
    hcDedication,
    hcLeaderboard,
    hcRecent,
    kittycoreLeaderboard,
    kittycoreRecent,
    path,
    recordBreaking,
    scLeaderboard,
    scRecent,
    totalRuns,
    classes,
  } = useLoaderData<typeof loader>();

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
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
          title="Kittycore"
          description="Who has managed to condense the worst experience in the game into the smallest amount of time"
        >
          <Leaderboard ascensions={kittycoreLeaderboard} />
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
          <Leaderboard title="Softcore" ascensions={scRecent} ranked={false} />
          <Leaderboard title="Hardcore" ascensions={hcRecent} ranked={false} />
          <Leaderboard
            title="Kittycore"
            ascensions={kittycoreRecent}
            ranked={false}
          />
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
