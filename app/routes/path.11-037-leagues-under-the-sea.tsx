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
  const slug = "11-037-leagues-under-the-sea";

  const path = await db.path.findFirst({
    where: { slug },
    include: { class: true },
  });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path, true);
};

export const meta = () => {
  return [
    { title: `Saṃsāra - 11,037 Leagues Under the Sea` },
    {
      name: "description",
      content: `Ascension stats for the 11,037 Leagues Under the Sea path`,
    },
  ];
};

export default function SeaPath() {
  const {
    frequency,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    hcSpecialLeaderboard,
    path,
    recordBreaking,
    scDedication,
    scLeaderboard,
    scPyrite,
    scSpecialLeaderboard,
    totalRuns,
    totalRunsInSeason,
  } = useLoaderData<typeof loader>();

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          slug="leaderboards"
          title="Leaderboards"
          description={
            <>
              The official leaderboards frozen once the path went out-of-season.
              These leaderboards only include post-nerf runs, and are considered
              the "true" leaderboards for the path.
            </>
          }
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
          slug="pre-nerf-leaderboards"
          title="Leaderboards (Pre-Nerf)"
          description="The official leaderboards for the pre-nerf path, for which commendations were issued."
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialLeaderboard}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="pyrites"
          title="Pyrites"
          description="{PYRITE}"
        >
          <Leaderboard title="Softcore Pyrites" ascensions={scPyrite} />
          <Leaderboard title="Hardcore Pyrites" ascensions={hcPyrite} />
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
