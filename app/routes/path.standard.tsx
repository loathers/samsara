import { Stack } from "@chakra-ui/react";
import { data, useLoaderData } from "react-router";

import { boardsFor } from "~/boards";
import { BoardSection } from "~/components/BoardSection";
import { ClassComparisonChart } from "~/components/ClassComparisonChart/ClassComparisonChart";
import { Dedication } from "~/components/Dedication";
import { Leaderboard } from "~/components/Leaderboard";
import { LeaderboardAccordion } from "~/components/LeaderboardAccordion";
import { LeaderboardAccordionItem } from "~/components/LeaderboardAccordionItem";
import { PathHeader } from "~/components/PathHeader";
import { findPathWithClasses } from "~/db.server";
import {
  getPathData,
  getStandardClassComparison,
  getStandardSeasons,
} from "~/path.server";

export const loader = async () => {
  const path = await findPathWithClasses({ slug: "standard" });

  if (!path) throw data({ message: "Invalid path name" }, { status: 400 });

  // Every season is a board, so name the one that is not to keep the page to two queries.
  const allTime = boardsFor(path).filter((board) => !board.ownSeason);

  const [pathData, seasons, classes] = await Promise.all([
    getPathData(path, allTime),
    getStandardSeasons(path),
    getStandardClassComparison(path),
  ]);

  return { ...pathData, seasons, classComparison: classes };
};

export const meta = () => {
  return [
    { title: `Saṃsāra - Standard` },
    {
      name: "description",
      content: `Ascension stats for the Standard path`,
    },
  ];
};

export default function PathPage() {
  const { classComparison, frequency, path, totalRuns, seasons, boards } =
    useLoaderData<typeof loader>();

  const {
    classes,
    hcDedication,
    hcPyrite,
    hcRecent,
    scDedication,
    scPyrite,
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
        <BoardSection
          slug="leaderboards"
          title="Leaderboards"
          description="The official leaderboards, a season at a time"
          boards={seasons.map(({ board, softcore, hardcore }) => ({
            key: board.key,
            label: board.label,
            content: (
              <>
                <Leaderboard
                  title="Softcore Leaderboard"
                  ascensions={softcore}
                  showClass
                >
                  <ClassComparisonChart
                    data={classComparison[Number(board.key)]?.softcore ?? []}
                  />
                </Leaderboard>
                <Leaderboard
                  title="Hardcore Leaderboard"
                  ascensions={hardcore}
                  showClass
                >
                  <ClassComparisonChart
                    data={classComparison[Number(board.key)]?.hardcore ?? []}
                  />
                </Leaderboard>
              </>
            ),
          }))}
        />
        <LeaderboardAccordionItem title="Pyrites" description="{PYRITE}">
          <Leaderboard
            title="Softcore Pyrites"
            ascensions={scPyrite}
            showClass
          >
            <ClassComparisonChart
              data={classes.pyrite.softcore}
            />
          </Leaderboard>
          <Leaderboard
            title="Hardcore Pyrites"
            ascensions={hcPyrite}
            showClass
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
          <Leaderboard
            title="Softcore"
            ascensions={scRecent}
            ranked={false}
            showClass
          />
          <Leaderboard
            title="Hardcore"
            ascensions={hcRecent}
            ranked={false}
            showClass
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
