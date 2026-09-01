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
  const slug = "one-crazy-random-summer";

  const path = await findPathWithClasses({ slug });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  return await getPathData(path, true);
};

export const meta = () => {
  return [
    { title: `Saṃsāra - One Crazy Random Summer` },
    {
      name: "description",
      content: `Ascension stats for the One Crazy Random Summer path`,
    },
  ];
};

export default function OCRSPath() {
  const {
    frequency,
    path,
    totalRuns,
    totalRunsInSeason,
    boards,
  } = useLoaderData<typeof loader>();

  const {
    classes,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    hcRecent,
    hcSpecialLeaderboard,
    hcSpecialPyrite,
    scDedication,
    scLeaderboard,
    scPyrite,
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
        extra="Fun"
        totalRuns={totalRuns}
        totalRunsInSeason={totalRunsInSeason}
      />
      <LeaderboardAccordion>
        <LeaderboardAccordionItem
          slug="fun-leaderboards"
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
            ascensions={scSpecialLeaderboard}
            alternativeScore={["Fun", "Fun"]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
            alternativeScore={["Fun", "Fun"]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="time-leaderboards"
          title="Leaderboards (Days/Turns)"
          description="Essentially a special pyrite; in-season leaderboards had this had been a normally ranked path"
        >
          <Leaderboard
            title="Softcore Leaderboard"
            ascensions={scLeaderboard}
            alternativeScore={["Fun", "Fun"]}
          >
            <ClassComparisonChart
              data={classes.main.softcore}
            />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
            alternativeScore={["Fun", "Fun"]}
          >
            <ClassComparisonChart
              data={classes.main.hardcore}
            />
          </Leaderboard>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="fun-pyrites"
          title="Pyrites (Fun)"
          description="{PYRITE}"
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scSpecialPyrite}
            alternativeScore={["Fun", "Fun"]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcSpecialPyrite}
            alternativeScore={["Fun", "Fun"]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="time-pyrites"
          title="Pyrites (Days/Turns)"
          description="A doubly hypothetical leaderboard for all-time; invented, respected, and dominated by turbo-fools"
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrite}
            alternativeScore={["Fun", "Fun"]}
          >
            <ClassComparisonChart
              data={classes.pyrite.softcore}
            />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            alternativeScore={["Fun", "Fun"]}
          >
            <ClassComparisonChart
              data={classes.pyrite.hardcore}
            />
          </Leaderboard>
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
        >
          <Leaderboard title="Softcore" ascensions={scRecent} ranked={false} />
          <Leaderboard title="Hardcore" ascensions={hcRecent} ranked={false} />
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
