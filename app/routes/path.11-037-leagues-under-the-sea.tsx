import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { hashSection } from "~/boards";
import { BoardSection } from "~/components/BoardSection";
import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import { type BoardData, getPathData } from "~/path.server";

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

const leaderboards = (b: BoardData) => (
  <>
    <Leaderboard title="Softcore Leaderboard" ascensions={b.scLeaderboard}>
      <ClassComparisonChart data={b.classes.main.softcore} />
    </Leaderboard>
    <Leaderboard title="Hardcore Leaderboard" ascensions={b.hcLeaderboard}>
      <ClassComparisonChart data={b.classes.main.hardcore} />
    </Leaderboard>
  </>
);

const dedication = (b: BoardData) => (
  <>
    <Dedication title="Softcore Dedication" dedication={b.scDedication} />
    <Dedication title="Hardcore Dedication" dedication={b.hcDedication} />
  </>
);

const era = (
  board: BoardData,
  content: React.ReactNode,
  description: React.ReactNode = null,
) => ({
  key: board.board.key,
  label: board.board.label,
  description,
  content,
});

export default function SeaPath() {
  const { boards, frequency, path, totalRuns, totalRunsInSeason } =
    useLoaderData<typeof loader>();

  // Pre-nerf can never gain another run, so it has nothing recent to show and a pyrite
  // board that would only repeat its leaderboard.
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
      <LeaderboardAccordion toItemValue={hashSection}>
        <BoardSection
          slug="leaderboards"
          title="Leaderboards"
          description="The official leaderboards frozen once the path went out-of-season"
          boards={[
            era(
              postNerf,
              leaderboards(postNerf),
              'Post-nerf runs only, and considered the "true" leaderboards for the path',
            ),
            era(
              preNerf,
              leaderboards(preNerf),
              "The pre-nerf path, for which commendations were issued",
            ),
          ]}
        />
        {showPyrites && (
          <BoardSection
            slug="pyrites"
            title="Pyrites"
            description="{PYRITE}"
            boards={[
              era(
                postNerf,
                <>
                  <Leaderboard
                    title="Softcore Pyrites"
                    ascensions={postNerf.scPyrite}
                  >
                    <ClassComparisonChart
                      data={postNerf.classes.pyrite.softcore}
                    />
                  </Leaderboard>
                  <Leaderboard
                    title="Hardcore Pyrites"
                    ascensions={postNerf.hcPyrite}
                  >
                    <ClassComparisonChart
                      data={postNerf.classes.pyrite.hardcore}
                    />
                  </Leaderboard>
                </>,
              ),
            ]}
          />
        )}
        <BoardSection
          slug="recent"
          title="Recent Ascensions"
          description="The most recent ascensions on this path"
          boards={[
            era(
              postNerf,
              <>
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
              </>,
            ),
          ]}
        />
        <BoardSection
          slug="dedication"
          title="Dedication"
          description="Players who have completed the most ascensions for this path"
          boards={[
            era(postNerf, dedication(postNerf)),
            era(preNerf, dedication(preNerf)),
          ]}
        />
      </LeaderboardAccordion>
    </Stack>
  );
}
