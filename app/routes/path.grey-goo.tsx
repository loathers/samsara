import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "grey-goo" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path, true);
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Grey Goo` },
    {
      name: "description",
      content: `Ascension stats for the Grey Goo path`,
    },
  ];
};

export default function GreyGooPath() {
  const {
    frequency,
    path,
    totalRuns,
    totalRunsInSeason,
    boards,
  } = useLoaderData<typeof loader>();

  const {
    hcRecent,
    hcSpecialLeaderboard,
    hcSpecialPyrite,
    scRecent,
    scSpecialLeaderboard,
    scSpecialPyrite,
  } = boards[0];

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
        extra="Goo Score"
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          slug="leaderboards"
          title="Leaderboards (Goo)"
          description="The official leaderboards frozen once the path went out-of-season. This season was ranked by Goo score, rather than days and turns"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialLeaderboard}
            alternativeScore={["Goo", "Goo Score"]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
            alternativeScore={["Goo", "Goo Score"]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="pyrites"
          title="Pyrites (Goo)"
          description="{PYRITE}"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scSpecialPyrite}
            alternativeScore={["Goo", "Goo Score"]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialPyrite}
            alternativeScore={["Goo", "Goo Score"]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard title="Softcore" ascensions={scRecent} ranked={false} />
          <Leaderboard title="Hardcore" ascensions={hcRecent} ranked={false} />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
