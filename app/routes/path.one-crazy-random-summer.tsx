import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { db } from "~/db.server";
import { getPathData } from "~/path.server";
import { getExtra } from "~/utils";

export const loader = async () => {
  const slug = "one-crazy-random-summer";

  const path = await db.path.findFirst({
    where: { slug },
    include: { class: true },
  });

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

const getFunScore = getExtra("Fun");

export default function OCRSPath() {
  const {
    frequency,
    hcDedication,
    hcLeaderboard,
    hcPyrite,
    hcSpecialLeaderboard,
    hcSpecialPyrite,
    path,
    recordBreaking,
    scDedication,
    scLeaderboard,
    scPyrite,
    scSpecialLeaderboard,
    scSpecialPyrite,
    totalRuns,
    totalRunsInSeason,
  } = useLoaderData<typeof loader>();

  return (
    <Stack gap={10}>
      <PathHeader
        path={path}
        frequency={frequency}
        recordBreaking={recordBreaking}
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
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcSpecialLeaderboard}
            alternativeScore={["Fun", getFunScore]}
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
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Leaderboard"
            ascensions={hcLeaderboard}
            alternativeScore={["Fun", getFunScore]}
          />
        </LeaderboardAccordionItem>
        <LeaderboardAccordionItem
          slug="fun-pyrites"
          title="Pyrites (Fun)"
          description="{PYRITE}"
        >
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scSpecialPyrite}
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcSpecialPyrite}
            alternativeScore={["Fun", getFunScore]}
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
            alternativeScore={["Fun", getFunScore]}
          />
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            alternativeScore={["Fun", getFunScore]}
          />
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
