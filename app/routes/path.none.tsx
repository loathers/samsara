import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const path = await db.path.findFirst({
    where: { slug: "none" },
    include: { class: true },
  });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return {
    ...(await getPathData(path)),
    casualLeaderboard: await db.ascension.getLeaderboard({
      path,
      lifestyle: "CASUAL",
    }),
    casualDedication: await db.player.getDedication(path, "CASUAL"),
  };
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
    path,
    frequency,
    recordBreaking,
    scLeaderboard,
    hcLeaderboard,
    casualLeaderboard,
    scDedication,
    hcDedication,
    casualDedication,
    totalRuns,
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
