import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import {
  findPathWithClasses,
  getDedication,
  getLeaderboard,
  getRecentAscensions,
} from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "none" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  const [pathData, casualLeaderboard, casualDedication, casualRecent] =
    await Promise.all([
      getPathData(path),
      getLeaderboard({ path, lifestyle: "CASUAL" }),
      getDedication(path, "CASUAL"),
      getRecentAscensions({ path, lifestyle: "CASUAL" }),
    ]);

  return { ...pathData, casualLeaderboard, casualDedication, casualRecent };
};

export const meta = () => {
  return [
    { title: `Saṃsāra - No Path` },
    {
      name: "description",
      content: `Ascension stats for unrestricted ascensions`,
    },
  ];
};

export default function NoPath() {
  const {
    casualDedication,
    casualLeaderboard,
    casualRecent,
    frequency,
    path,
    totalRuns,
    boards,
  } = useLoaderData<typeof loader>();

  // A single-board path, so everything comes from the one board.
  const {
    hcDedication,
    hcLeaderboard,
    hcRecent,
    scDedication,
    scLeaderboard,
    scRecent,
  } = boards[0];

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
          title="Leaderboards"
          description="The official leaderboards as they currently stand"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scLeaderboard}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Casual"
          description="No ronin, no karma, all vibes"
        >
          <Leaderboard
            title="Casual Leaderboard"
            ascensions={casualLeaderboard}
          />
          <Dedication title="Casual Dedication" dedication={casualDedication} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard title="Softcore" ascensions={scRecent} ranked={false} />
          <Leaderboard title="Hardcore" ascensions={hcRecent} ranked={false} />
          <Leaderboard title="Casual" ascensions={casualRecent} ranked={false} />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication title="Softcore Dedication" dedication={scDedication} />
          <Dedication title="Hardcore Dedication" dedication={hcDedication} />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
