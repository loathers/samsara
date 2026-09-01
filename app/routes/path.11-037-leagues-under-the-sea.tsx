import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import { getPathData } from "~/path.server";

export const loader = async () => {
  const slug = "11-037-leagues-under-the-sea";

  const path = await findPathWithClasses({ slug });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path);
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
  const { boards, frequency, path, totalRuns, totalRunsInSeason } =
    useLoaderData<typeof loader>();

  // The nerf split the season in two. Post-nerf is the path as it stands, so it carries
  // the page; pre-nerf is a closed era that can never gain another run, which leaves it
  // nothing recent to show and a pyrite board that would only repeat its leaderboard.
  const [postNerf, preNerf] = boards;

  const showPyrites = postNerf.scPyrite.length + postNerf.hcPyrite.length > 0;

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        boards={boards}
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
              the &quot;true&quot; leaderboards for the path.
            </>
          }
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={postNerf.scLeaderboard}
          >
            <ClassComparisonChart data={postNerf.classes.main.softcore} />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={postNerf.hcLeaderboard}
          >
            <ClassComparisonChart data={postNerf.classes.main.hardcore} />
          </Leaderboard>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="pre-nerf-leaderboards"
          title="Leaderboards (Pre-Nerf)"
          description="The official leaderboards for the pre-nerf path, for which commendations were issued."
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={preNerf.scLeaderboard}
          >
            <ClassComparisonChart data={preNerf.classes.main.softcore} />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={preNerf.hcLeaderboard}
          >
            <ClassComparisonChart data={preNerf.classes.main.hardcore} />
          </Leaderboard>
        </LeaderboardAccordionItem>
        {showPyrites && (
          <LeaderboardAccordionItem
            slug="pyrites"
            title="Pyrites"
            description="{PYRITE}"
          >
            <Leaderboard
              title="Softcore Pyrites"
              ascensions={postNerf.scPyrite}
            >
              <ClassComparisonChart data={postNerf.classes.pyrite.softcore} />
            </Leaderboard>
            <Leaderboard
              title="Hardcore Pyrites"
              ascensions={postNerf.hcPyrite}
            >
              <ClassComparisonChart data={postNerf.classes.pyrite.hardcore} />
            </Leaderboard>
          </LeaderboardAccordionItem>
        )}
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard
            title="Softcore"
            ascensions={postNerf.scRecent}
            ranked={false}
          />
          <Leaderboard
            title="Hardcore"
            ascensions={postNerf.hcRecent}
            ranked={false}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
        >
          <Dedication
            title="Softcore Dedication"
            dedication={postNerf.scDedication}
          />
          <Dedication
            title="Hardcore Dedication"
            dedication={postNerf.hcDedication}
          />
        </LeaderboardAccordionItem>
      </LeaderboardAccordion>
    </Stack>
  );
}
